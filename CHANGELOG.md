## CHANGELOG

### v1.3.5

  - Add `panel.closeAll()`.

### v1.3.4

  - Return closed results when calling `panelFrame.close()`.

### v1.3.2

  - Add `panel.getPanels`.

### v1.3.0

  - Add version conflict protection.
  - Change ipc message header from `panel:` to `electron-panel:`.

### v1.2.1

  - Prevent load the panel frame more than once when its src changed.

### v1.2.0

  - Use Custom Element v1.
  - Update Electron to v1.6.0.

### v1.1.0

  - Add method `panel.contains` in renderer process.
  - Add method `panel.find` in renderer process.
