# Fix: "Filename longer than 260 characters" on Android build (Windows)

The Android native build fails because the full path to generated files exceeds Windows' 260-character limit.

## Option A: Enable long paths in Windows (recommended first)

1. **Run PowerShell as Administrator** (right-click → Run as administrator).

2. **Enable long paths**:
   ```powershell
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```

3. **Reboot** your PC (required for all processes to pick up the change).

4. **Clean and rebuild** from the project root:
   ```powershell
   cd C:\Users\Lenovo\Downloads\Hotel-Booking-Hub\Hotel-Booking-Hub
   Remove-Item -Recurse -Force android\app\.cxx -ErrorAction SilentlyContinue
   npx expo run:android
   ```

If the build still fails with the same error, the Ninja bundled with the Android SDK may not be long-path aware. Use Option B.

---

## Option B: Move project to a short path

1. Move (or clone) the project to a short path, for example:
   - `C:\HB` (e.g. `xcopy /E /I "C:\Users\Lenovo\Downloads\Hotel-Booking-Hub\Hotel-Booking-Hub" "C:\HB"`)
   - or `C:\dev\HotelApp`

2. In the new folder:
   ```powershell
   cd C:\HB
   npm install
   npx expo run:android
   ```

3. Use the new path for all future work (and update `.env` / backend URL if needed).

---

## Option C: Use a virtual drive (subst)

Without moving files, you can make the project appear under a short path:

1. **Open Command Prompt or PowerShell as Administrator.**

2. **Create a virtual drive** (pick a free letter, e.g. `H:`):
   ```powershell
   subst H: "C:\Users\Lenovo\Downloads\Hotel-Booking-Hub\Hotel-Booking-Hub"
   ```

3. **Build from the virtual drive**:
   ```powershell
   H:
   npm install
   npx expo run:android
   ```

4. The drive stays until reboot. To remove it: `subst H: /D`.
