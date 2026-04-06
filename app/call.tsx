import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";
import { openCallWebSocket } from "@/lib/call-signalling";

const isWeb = Platform.OS === "web";

let RNWebRTC: any = null;
if (!isWeb) {
  try {
    RNWebRTC = require("react-native-webrtc");
  } catch {}
}

function generateCallId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function useCallDuration(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [active]);
  return seconds;
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** Optimize SDP for high-quality voice: Opus FEC, bitrate for clarity and packet-loss resilience */
function optimizeSdpForVoice(sdp: RTCSessionDescriptionInit): RTCSessionDescriptionInit {
  let sdpStr = typeof sdp.sdp === "string" ? sdp.sdp : "";
  if (!sdpStr) return sdp;

  sdpStr = sdpStr.replace(/a=fmtp:(\d+)\s+([^\r\n]+)/g, (_, pt: string, rest: string) => {
    if (!/opus/i.test(rest)) return `a=fmtp:${pt} ${rest}`;
    const parts = rest.split(";").filter(Boolean);
    const params: Record<string, string> = {};
    parts.forEach((p) => {
      const eq = p.indexOf("=");
      if (eq > 0) params[p.slice(0, eq).trim()] = p.slice(eq + 1).trim();
    });
    params.useinbandfec = "1";
    params.maxaveragebitrate = "320000";
    params.minptime = "10";
    const prefix = parts[0].includes("=") ? "" : parts[0] + ";";
    const fmtpParams = Object.entries(params).map(([k, v]) => `${k}=${v}`).join(";");
    return `a=fmtp:${pt} ${prefix}${fmtpParams}`;
  });

  const rtpmapMatch = sdpStr.match(/a=rtpmap:(\d+)\s+opus\/\d+/i);
  if (rtpmapMatch) {
    const pt = rtpmapMatch[1];
    if (!sdpStr.includes(`a=fmtp:${pt}`)) {
      sdpStr = sdpStr.replace(
        new RegExp(`(a=rtpmap:${pt}\\s+opus/[^\\r\\n]+)`, "i"),
        `$1\r\na=fmtp:${pt} useinbandfec=1;maxaveragebitrate=320000;minptime=10`
      );
    }
  }

  return { type: sdp.type, sdp: sdpStr };
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

export default function CallScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const params = useLocalSearchParams<{
    hotelId?: string;
    hotelName?: string;
    callId?: string;
    remoteName?: string;
    isIncoming?: string;
    voiceOnly?: string;
  }>();
  const hotelId = params.hotelId ?? "";
  const hotelName = params.hotelName ?? "Hotel";
  const paramCallId = params.callId ?? "";
  const remoteNameParam = params.remoteName ?? hotelName;
  const isCallee = !!(params.isIncoming === "1" && paramCallId);

  const [status, setStatus] = useState<"connecting" | "connected" | "ended" | "error">("connecting");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const voiceOnly = params.voiceOnly === "1";
  const [videoOff, setVideoOff] = useState(voiceOnly);
  const [hasVideoTrack, setHasVideoTrack] = useState(!voiceOnly);
  const callDuration = useCallDuration(status === "connected");

  const callIdRef = useRef(paramCallId || generateCallId());
  const callId = callIdRef.current;
  const roomId = `call-${callId}`;
  const remoteName = isCallee ? remoteNameParam : hotelName;
  const sendRef = useRef<(msg: object) => void>(() => {});
  const closeWsRef = useRef<() => void>(() => {});
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [localStreamURL, setLocalStreamURL] = useState<string | null>(null);
  const [remoteStreamURL, setRemoteStreamURL] = useState<string | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const endCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t: any) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    if (!isWeb) {
      setLocalStreamURL(null);
      setRemoteStreamURL(null);
    }
    sendRef.current({ type: "call:leave", roomId });
    closeWsRef.current();
    setStatus("ended");
    router.back();
  };

  const audioConstraints: MediaTrackConstraints = {
    echoCancellation: { ideal: true },
    noiseSuppression: { ideal: true },
    autoGainControl: { ideal: true },
    sampleRate: { ideal: 48000 },
    channelCount: { ideal: 1 },
  };

  const getLocalStream = async (): Promise<any> => {
    const mediaConstraints = {
      audio: audioConstraints,
      video: !voiceOnly
        ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
        : false,
    };
    if (isWeb) {
      if (!navigator.mediaDevices?.getUserMedia) return null;
      try {
        const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        localStreamRef.current = stream;
        const localVideo = (localVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current;
        if (localVideo) localVideo.srcObject = stream;
        return stream;
      } catch {
        return null;
      }
    }
    if (RNWebRTC?.mediaDevices) {
      try {
        const stream = await RNWebRTC.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: !voiceOnly,
        });
        localStreamRef.current = stream;
        setLocalStreamURL(stream.toURL());
        return stream;
      } catch {
        return null;
      }
    }
    return null;
  };

  const createPeerConnection = (remoteUserId: string): any => {
    const config: RTCConfiguration = {
      iceServers: ICE_SERVERS,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    };
    if (isWeb && typeof window !== "undefined" && window.RTCPeerConnection) {
      const pc = new (window as any).RTCPeerConnection(config);
      localStreamRef.current?.getTracks().forEach((track: any) => {
        pc.addTrack(track, localStreamRef.current!);
      });
      pc.ontrack = (e: any) => {
        if (e.streams?.[0]) {
          remoteStreamRef.current = e.streams[0];
          setHasRemoteStream(true);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = e.streams[0];
            remoteVideoRef.current.play().catch(() => {});
          }
        }
      };
      pc.onicecandidate = (e: any) => {
        if (e.candidate) {
          sendRef.current({ type: "call:ice", toUserId: remoteUserId, candidate: e.candidate.toJSON() });
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setStatus("connected");
        else if (pc.connectionState === "failed" || pc.connectionState === "closed") setStatus("ended");
        else if (pc.connectionState === "disconnected") {
          setTimeout(() => { if (pc.connectionState === "disconnected") setStatus("ended"); }, 5000);
        }
      };
      return pc;
    }
    if (!isWeb && RNWebRTC?.RTCPeerConnection) {
      const RTCPeerConnection = RNWebRTC.RTCPeerConnection;
      const MediaStream = RNWebRTC.MediaStream;
      const pc = new RTCPeerConnection(config);
      const localStream = localStreamRef.current;
      if (localStream?.getTracks) {
        localStream.getTracks().forEach((track: any) => {
          pc.addTrack(track, localStream);
        });
      }
      pc.ontrack = (e: any) => {
        let stream = remoteStreamRef.current;
        if (!stream && MediaStream) {
          stream = new MediaStream();
          remoteStreamRef.current = stream;
        }
        if (stream && e.track) {
          (stream as any).addTrack(e.track);
          setRemoteStreamURL(stream.toURL());
          setHasRemoteStream(true);
        }
      };
      pc.onicecandidate = (e: any) => {
        if (e.candidate) {
          sendRef.current({ type: "call:ice", toUserId: remoteUserId, candidate: e.candidate.toJSON() });
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setStatus("connected");
        else if (pc.connectionState === "failed" || pc.connectionState === "closed") setStatus("ended");
        else if (pc.connectionState === "disconnected") {
          setTimeout(() => { if (pc.connectionState === "disconnected") setStatus("ended"); }, 5000);
        }
      };
      return pc;
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = openCallWebSocket(
      (msg) => {
        if (msg.type === "call:peers") {
          const peerIds = msg.peerIds ?? [];
          if (peerIds.length > 0) {
            remoteUserIdRef.current = peerIds[0];
            getLocalStream().then((stream) => {
              if (!stream) {
                setErrorMessage("Microphone access denied. Please allow microphone permission.");
                setStatus("error");
                return;
              }
              const pc = createPeerConnection(peerIds[0]);
              if (pc) {
                pcRef.current = pc;
                pc.createOffer()
                  .then((offer) => {
                    const optimized = optimizeSdpForVoice(offer);
                    pc.setLocalDescription(optimized);
                    sendRef.current({
                      type: "call:offer",
                      toUserId: peerIds[0],
                      sdp: optimized,
                    });
                  })
                  .catch(() => {
                    setErrorMessage("Connection failed");
                    setStatus("error");
                  });
              }
            });
          }
        } else if (msg.type === "call:peer-joined") {
          remoteUserIdRef.current = msg.userId;
          getLocalStream().then((stream) => {
            if (!stream) {
              setErrorMessage("Microphone access denied. Please allow microphone permission.");
              setStatus("error");
              return;
            }
            const pc = createPeerConnection(msg.userId);
            if (pc) {
              pcRef.current = pc;
            }
          });
        } else if (msg.type === "call:peer-left") {
          pcRef.current?.close();
          pcRef.current = null;
          remoteUserIdRef.current = null;
          remoteStreamRef.current = null;
          setHasRemoteStream(false);
          if (!isWeb) setRemoteStreamURL(null);
          setStatus("connecting");
        } else if (msg.type === "call:room-full") {
          setErrorMessage("Room full");
          setStatus("error");
          closeWsRef.current();
          setTimeout(() => router.back(), 1500);
        } else if (msg.type === "call:offer") {
          pcRef.current?.close();
          pcRef.current = null;
          getLocalStream().then((stream) => {
            if (!stream) {
              setErrorMessage("Microphone access denied. Please allow microphone permission.");
              setStatus("error");
              return;
            }
            const pc = createPeerConnection(msg.fromUserId);
            if (!pc) return;
            pcRef.current = pc;
            const SessionDesc = isWeb && typeof window !== "undefined" ? (window as any).RTCSessionDescription : RNWebRTC?.RTCSessionDescription;
            if (SessionDesc) {
              pc.setRemoteDescription(new SessionDesc(msg.sdp))
                .then(() => {
                  iceQueueRef.current.forEach((c) => {
                    const IceCand = isWeb && typeof window !== "undefined" ? (window as any).RTCIceCandidate : RNWebRTC?.RTCIceCandidate;
                    pc.addIceCandidate(new IceCand(c)).catch(() => {});
                  });
                  iceQueueRef.current = [];
                  return pc.createAnswer();
                })
                .then((answer: any) => {
                  const optimized = optimizeSdpForVoice(answer);
                  pc.setLocalDescription(optimized);
                  sendRef.current({
                    type: "call:answer",
                    toUserId: msg.fromUserId,
                    sdp: optimized,
                  });
                })
                .catch(() => {
                  setErrorMessage("Connection failed");
                  setStatus("error");
                });
            }
          });
        } else if (msg.type === "call:answer") {
          const SessionDesc = isWeb && typeof window !== "undefined" ? (window as any).RTCSessionDescription : RNWebRTC?.RTCSessionDescription;
          if (SessionDesc && pcRef.current) {
            pcRef.current.setRemoteDescription(new SessionDesc(msg.sdp))
              .then(() => {
                const IceCand = isWeb && typeof window !== "undefined" ? (window as any).RTCIceCandidate : RNWebRTC?.RTCIceCandidate;
                iceQueueRef.current.forEach((c) => {
                  pcRef.current?.addIceCandidate(new IceCand(c)).catch(() => {});
                });
                iceQueueRef.current = [];
              })
              .catch(() => {
                setErrorMessage("Connection failed");
                setStatus("error");
              });
          }
        } else if (msg.type === "call:ice") {
          const c = msg.candidate;
          const IceCand = isWeb && typeof window !== "undefined" ? (window as any).RTCIceCandidate : RNWebRTC?.RTCIceCandidate;
          if (!c || !pcRef.current || !IceCand) return;
          const addCand = (cand: RTCIceCandidateInit) => {
            pcRef.current?.addIceCandidate(new IceCand(cand))
              .catch(() => {});
          };
          if (pcRef.current.remoteDescription) {
            addCand(c);
            const q = iceQueueRef.current;
            while (q.length > 0) {
              addCand(q.shift()!);
            }
          } else {
            iceQueueRef.current.push(c);
          }
        }
      },
      (send, close) => {
        sendRef.current = send;
        closeWsRef.current = close;
        if (isCallee) {
          send({ type: "call:join", roomId });
        } else {
          send({
            type: "call:start",
            callId,
            hotelId,
            hotelName,
            fromUserId: user?.id ?? "",
            fromName: user?.name ?? "Guest",
          });
          send({ type: "call:join", roomId });
        }
      }
    );

    return () => {
      unsubscribe();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [roomId, isCallee, callId, hotelId, hotelName, user?.id, user?.name, voiceOnly]);

  useEffect(() => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    audioTracks.forEach((t) => {
      t.enabled = !muted;
    });
  }, [muted]);

  useEffect(() => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    videoTracks.forEach((t) => {
      t.enabled = !videoOff;
    });
    if (isWeb && localVideoRef.current) {
      const el = (localVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current;
      if (el) {
        if (videoOff) {
          el.srcObject = null;
          el.style.opacity = "0";
        } else {
          el.srcObject = localStreamRef.current;
          el.style.opacity = "1";
        }
      }
    }
  }, [videoOff]);

  const addVideoTrack = useCallback(async () => {
    const remoteId = remoteUserIdRef.current;
    if (!remoteId || !pcRef.current || !localStreamRef.current) return;
    try {
      const mediaConstraints = { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } };
      let stream: MediaStream;
      if (isWeb && navigator.mediaDevices?.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      } else if (RNWebRTC?.mediaDevices?.getUserMedia) {
        stream = await RNWebRTC.mediaDevices.getUserMedia(mediaConstraints);
      } else return;
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return;
      stream.getTracks().forEach((t) => {
        if (t.kind !== "video") t.stop();
      });
      localStreamRef.current.addTrack(videoTrack);
      pcRef.current.addTrack(videoTrack, localStreamRef.current);
      setHasVideoTrack(true);
      setVideoOff(false);
      if (isWeb) {
        setTimeout(() => {
          const el = (localVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current;
          if (el && localStreamRef.current) {
            el.srcObject = localStreamRef.current;
            el.style.opacity = "1";
          }
        }, 150);
      } else if (localStreamRef.current?.toURL) {
        setLocalStreamURL(localStreamRef.current.toURL());
      }
      pcRef.current.createOffer().then((offer) => {
        const optimized = optimizeSdpForVoice(offer);
        pcRef.current?.setLocalDescription(optimized);
        sendRef.current({ type: "call:offer", toUserId: remoteId, sdp: optimized });
      }).catch(() => {});
    } catch {}
  }, []);

  const openChat = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { authFetch } = await import("@/lib/auth");
      const supportRes = await authFetch("/api/chat/support-user");
      if (!supportRes.ok) return;
      const support = await supportRes.json();
      const convoRes = await authFetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: support.id }),
      });
      if (!convoRes.ok) return;
      const convo = await convoRes.json();
      router.push({
        pathname: "/(tabs)/chat/[id]",
        params: { id: convo.id, otherName: support.name || hotelName, otherAvatar: support.avatar || "" },
      });
    } catch {}
  };

  if (!isWeb && !RNWebRTC) {
    return (
      <View style={[styles.container, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Call</Text>
        </View>
        <View style={styles.placeholder}>
          <Ionicons name="videocam-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.placeholderTitle}>Video call</Text>
          <Text style={styles.placeholderText}>
            Run a development build (npx expo prebuild && npx expo run:ios / run:android) so react-native-webrtc is linked.
          </Text>
          <Pressable style={styles.endBtn} onPress={() => router.back()}>
            <Ionicons name="call" size={24} color="#fff" />
            <Text style={styles.endBtnText}>End</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const remoteContainerRef = useRef<View>(null);
  const localContainerRef = useRef<View>(null);
  const createdVideosRef = useRef<HTMLVideoElement[]>([]);

  const inVideoModeForRefs = hasVideoTrack || !voiceOnly;
  useEffect(() => {
    if (!isWeb || typeof document === "undefined" || !inVideoModeForRefs) return;
    const id = setTimeout(() => {
      const getNode = (ref: React.RefObject<View | null>): HTMLElement | null => {
        const r = ref.current as any;
        if (!r) return null;
        return (typeof r.getNativeNode === "function" ? r.getNativeNode() : r) as HTMLElement;
      };
      const remoteContainer = getNode(remoteContainerRef);
      const localContainer = getNode(localContainerRef);
      if (!remoteContainer || !localContainer) return;

      const remoteVideo = document.createElement("video");
      remoteVideo.autoplay = true;
      remoteVideo.playsInline = true;
      remoteVideo.muted = false;
      remoteVideo.setAttribute("playsinline", "true");
      remoteVideo.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;";
      remoteContainer.style.position = "relative";
      remoteContainer.style.flex = "1";
      remoteContainer.appendChild(remoteVideo);
      (remoteVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = remoteVideo;
      createdVideosRef.current.push(remoteVideo);

      const localVideo = document.createElement("video");
      localVideo.autoplay = true;
      localVideo.playsInline = true;
      localVideo.muted = true;
      localVideo.style.cssText = "width:100%;height:100%;object-fit:cover;";
      if (localStreamRef.current && !videoOff) {
        localVideo.srcObject = localStreamRef.current;
      }
      localContainer.appendChild(localVideo);
      (localVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = localVideo;
      createdVideosRef.current.push(localVideo);
    }, 100);
    return () => {
      clearTimeout(id);
      createdVideosRef.current.forEach((el) => el.remove());
      createdVideosRef.current = [];
    };
  }, [isWeb, inVideoModeForRefs]);

  if (status === "error") {
    return (
      <View style={[styles.container, styles.containerDark, styles.centered, { paddingTop: topInset }]}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <Text style={styles.errorTitle}>{errorMessage || "Call failed"}</Text>
        <Text style={styles.errorSub}>Please check permissions and try again.</Text>
        <Pressable style={[styles.endBtn, { marginTop: 24 }]} onPress={() => router.back()}>
          <Text style={styles.endBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const renderVideoArea = () => {
    const inVideoMode = hasVideoTrack || !voiceOnly;
    if (!inVideoMode) {
      return (
        <>
          <View style={styles.remotePlaceholder}>
            <View style={styles.voiceAvatar}>
              <Ionicons name="person" size={rs(72)} color="rgba(255,255,255,0.7)" />
            </View>
            <Text style={styles.remotePlaceholderText}>{remoteName}</Text>
            <Text style={styles.connectingText}>
              {status === "connecting" ? "Connecting..." : hasRemoteStream ? "Connected" : "Waiting..."}
            </Text>
          </View>
        </>
      );
    }
    if (isWeb) {
      return (
        <>
          <View ref={remoteContainerRef} style={StyleSheet.absoluteFill} collapsable={false} />
          {!hasRemoteStream && (
            <View style={styles.remotePlaceholder} pointerEvents="none">
              <View style={styles.remoteAvatar}>
                <Ionicons name="person" size={rs(64)} color="rgba(255,255,255,0.6)" />
              </View>
              <Text style={styles.remotePlaceholderText}>{remoteName}</Text>
              <Text style={styles.connectingText}>
                {status === "connecting" ? "Connecting..." : "Waiting for peer..."}
              </Text>
            </View>
          )}
          <View style={styles.pipWrap}>
            <View ref={localContainerRef} style={StyleSheet.absoluteFill} collapsable={false} />
            {videoOff && (
              <View style={StyleSheet.absoluteFill}>
                <View style={styles.videoOffOverlay}>
                  <Ionicons name="videocam-off" size={rs(28)} color="#fff" />
                </View>
              </View>
            )}
            <View style={styles.pipLabel}>
              <Text style={styles.pipLabelText}>You</Text>
            </View>
          </View>
        </>
      );
    }
    const RTCViewComponent = RNWebRTC?.RTCView;
    return (
      <>
        {RTCViewComponent && remoteStreamURL ? (
          <RTCViewComponent streamURL={remoteStreamURL} style={StyleSheet.absoluteFill} objectFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.remotePlaceholderBg]} />
        )}
        {!hasRemoteStream && (
          <View style={styles.remotePlaceholder} pointerEvents="none">
            <View style={styles.remoteAvatar}>
              <Ionicons name="person" size={rs(64)} color="rgba(255,255,255,0.6)" />
            </View>
            <Text style={styles.remotePlaceholderText}>{remoteName}</Text>
            <Text style={styles.connectingText}>
              {status === "connecting" ? "Connecting..." : "Waiting for peer..."}
            </Text>
          </View>
        )}
        <View style={styles.pipWrap}>
          {RTCViewComponent && localStreamURL ? (
            <RTCViewComponent streamURL={localStreamURL} style={StyleSheet.absoluteFill} objectFit="cover" mirror />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.pipPlaceholder]} />
          )}
          {videoOff && (
            <View style={StyleSheet.absoluteFill}>
              <View style={styles.videoOffOverlay}>
                <Ionicons name="videocam-off" size={rs(28)} color="#fff" />
              </View>
            </View>
          )}
          <View style={styles.pipLabel}>
            <Text style={styles.pipLabelText}>You</Text>
          </View>
        </View>
      </>
    );
  };

  const ControlButton = ({
    icon,
    label,
    onPress,
    active = false,
    danger = false,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
    active?: boolean;
    danger?: boolean;
  }) => (
    <Pressable
      style={({ pressed }) => [
        styles.controlBtn,
        pressed && styles.controlBtnPressed,
        active && styles.controlBtnActive,
      ]}
      onPress={onPress}
    >
      <View style={[styles.controlIconWrap, danger && styles.controlIconWrapDanger]}>
        <Ionicons
          name={icon as any}
          size={rs(22)}
          color={danger ? "#fff" : active ? Colors.primary : "#fff"}
        />
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, styles.containerDark, { paddingTop: topInset }]}>
      <View style={styles.videoArea}>
        {renderVideoArea()}
      </View>

      <View style={styles.topOverlay}>
        <View style={styles.topInfoRow}>
          <Text style={styles.topParticipantName} numberOfLines={1}>
            {remoteName}
          </Text>
          <View style={styles.topDurationBadge}>
            <View style={[styles.liveDot, styles.liveDotSmall]} />
            <Text style={styles.topDurationText}>{formatDuration(callDuration)}</Text>
          </View>
        </View>
        {status === "connecting" && (
          <View style={styles.connectingPill}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.connectingPillText}>Connecting...</Text>
          </View>
        )}
      </View>

      <View style={[styles.controlBar, { paddingBottom: bottomInset + rs(20) }]}>
        <ControlButton
          icon={speakerOn ? "volume-high" : "volume-medium"}
          label={speakerOn ? "Speaker On" : "Speaker"}
          active={speakerOn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSpeakerOn((prev) => !prev);
          }}
        />
        <ControlButton
          icon={muted ? "mic-off" : "mic"}
          label={muted ? "Unmute" : "Mute"}
          active={muted}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMuted((m) => !m);
          }}
        />
        <Pressable
          style={({ pressed }) => [styles.endCallBtnWrap, pressed && styles.endCallBtnPressed]}
          onPress={endCall}
        >
          <View style={styles.endCallBtn}>
            <Ionicons name="call" size={rs(26)} color="#fff" />
          </View>
          <Text style={styles.endCallLabel}>End</Text>
        </Pressable>
        <ControlButton
          icon={videoOff || !hasVideoTrack ? "videocam-off" : "videocam"}
          label={!hasVideoTrack ? "Camera" : videoOff ? "Camera off" : "Camera"}
          active={videoOff && hasVideoTrack}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (!hasVideoTrack) {
              addVideoTrack();
            } else {
              setVideoOff((v) => !v);
            }
          }}
        />
        <ControlButton
          icon="chatbubbles"
          label="Chat"
          onPress={openChat}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerDark: {
    backgroundColor: "#1a1a1a",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 12,
  },
  videoArea: {
    flex: 1,
    position: "relative",
  },
  remoteVideo: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  remotePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1c1c1e",
  },
  remotePlaceholderBg: {
    backgroundColor: "#1c1c1e",
  },
  remoteAvatar: {
    width: rs(100),
    height: rs(100),
    borderRadius: rs(50),
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rs(16),
  },
  voiceAvatar: {
    width: rs(120),
    height: rs(120),
    borderRadius: rs(60),
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rs(16),
  },
  remotePlaceholderText: {
    fontSize: rf(18),
    fontWeight: "600",
    color: "#fff",
    marginTop: rs(12),
  },
  connectingText: {
    fontSize: rf(14),
    color: "rgba(255,255,255,0.7)",
    marginTop: rs(6),
  },
  liveBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  liveDot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    backgroundColor: "#22c55e",
  },
  liveText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  nameTimeRow: {
    position: "absolute",
    bottom: 100,
    left: 16,
  },
  participantName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  callTime: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  pipWrap: {
    position: "absolute",
    top: rs(16),
    right: rs(16),
    width: rs(110),
    height: rs(148),
    borderRadius: rs(14),
    overflow: "hidden",
    backgroundColor: "#1c1c1e",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  localVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  videoOffOverlay: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  pipPlaceholder: {
    backgroundColor: "#2a2a2a",
  },
  pipLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: rs(4),
    paddingHorizontal: rs(8),
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  pipLabelText: {
    fontSize: rf(11),
    fontWeight: "600",
    color: "#fff",
  },
  topOverlay: {
    position: "absolute",
    top: rs(12),
    left: rs(16),
    right: rs(130),
    zIndex: 10,
  },
  topInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "nowrap",
  },
  topParticipantName: {
    fontSize: rf(18),
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    marginRight: rs(10),
  },
  topDurationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: rs(10),
    paddingVertical: rs(6),
    borderRadius: rs(20),
    gap: rs(6),
  },
  topDurationText: {
    fontSize: rf(13),
    fontWeight: "500",
    color: "#fff",
  },
  liveDotSmall: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
  },
  connectingPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: rs(8),
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: rs(12),
    paddingVertical: rs(8),
    borderRadius: rs(20),
    gap: rs(8),
  },
  connectingPillText: {
    fontSize: rf(13),
    color: "rgba(255,255,255,0.95)",
  },
  controlBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingHorizontal: rs(12),
    paddingTop: rs(16),
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  controlBtn: {
    alignItems: "center",
    minWidth: rs(56),
  },
  controlBtnPressed: {
    opacity: 0.7,
  },
  controlBtnActive: {
    opacity: 1,
  },
  controlIconWrap: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(24),
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlIconWrapDanger: {
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  controlLabel: {
    fontSize: rf(11),
    color: "rgba(255,255,255,0.9)",
    marginTop: rs(4),
    fontWeight: "500",
  },
  endCallBtnWrap: {
    alignItems: "center",
    minWidth: rs(64),
  },
  endCallBtnPressed: {
    opacity: 0.85,
  },
  endCallBtn: {
    width: rs(60),
    height: rs(60),
    borderRadius: rs(30),
    backgroundColor: "#e63946",
    alignItems: "center",
    justifyContent: "center",
  },
  endCallLabel: {
    fontSize: rf(12),
    fontWeight: "600",
    color: "#fff",
    marginTop: rs(6),
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  endBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#ef4444",
  },
  endBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
