// Jarvis Screen Overlay
// Compiled once by the agent: swiftc overlay.swift -o overlay-bin
// Communicates via stdin JSON lines:
//   {"event":"executing","tool":"run_command"}
//   {"event":"idle"}
//   {"event":"error"}

import Cocoa
import Foundation

// MARK: - Colors

extension NSColor {
    static let jarvisBlue   = NSColor(red: 0.20, green: 0.60, blue: 1.00, alpha: 1)
    static let jarvisGreen  = NSColor(red: 0.20, green: 0.90, blue: 0.50, alpha: 1)
    static let jarvisOrange = NSColor(red: 1.00, green: 0.60, blue: 0.20, alpha: 1)
    static let jarvisRed    = NSColor(red: 1.00, green: 0.30, blue: 0.30, alpha: 1)
}

// MARK: - Gradient View (one per edge)

enum EdgeDirection { case top, bottom, left, right }

class GradientView: NSView {
    var glowColor: NSColor = .jarvisBlue { didSet { needsDisplay = true } }
    var direction: EdgeDirection = .top

    override func draw(_ dirtyRect: NSRect) {
        let angle: CGFloat
        switch direction {
        case .top:    angle = 270   // color at top, fades downward
        case .bottom: angle = 90    // color at bottom, fades upward
        case .left:   angle = 0     // color at left, fades right
        case .right:  angle = 180   // color at right, fades left
        }
        NSGradient(starting: glowColor, ending: .clear)?
            .draw(in: bounds, angle: angle)
    }
}

// MARK: - Edge Glow Window

class EdgeGlowWindow: NSWindow {
    private let gradientView: GradientView
    private var glowTimer: Timer?
    private var glowPhase: Double = 0

    init(frame: NSRect, direction: EdgeDirection) {
        gradientView = GradientView(frame: NSRect(origin: .zero, size: frame.size))
        gradientView.direction = direction

        super.init(contentRect: frame, styleMask: .borderless, backing: .buffered, defer: false)
        level = NSWindow.Level(rawValue: Int(CGWindowLevelForKey(.screenSaverWindow)))
        backgroundColor = .clear
        isOpaque = false
        ignoresMouseEvents = true
        hasShadow = false
        isReleasedWhenClosed = false
        collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .transient]
        alphaValue = 0
        contentView?.addSubview(gradientView)
    }

    func activate(color: NSColor) {
        gradientView.glowColor = color
        glowTimer?.invalidate()
        glowPhase = 0
        glowTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 30.0, repeats: true) { [weak self] _ in
            guard let self else { return }
            self.glowPhase += 0.07
            self.alphaValue = CGFloat(sin(self.glowPhase) * 0.35 + 0.5)
        }
    }

    func deactivate() {
        glowTimer?.invalidate()
        glowTimer = nil
        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = 0.6
            self.animator().alphaValue = 0
        }
    }
}

// MARK: - Status Widget

class StatusWidget: NSPanel {
    private let dot = NSView()
    private let titleLabel = NSTextField(labelWithString: "Jarvis")
    private let subtitleLabel = NSTextField(labelWithString: "idle")
    private var pulseTimer: Timer?
    private var pulsePhase: Double = 0

    init() {
        guard let screen = NSScreen.main else {
            fatalError("No screen")
        }
        let vis = screen.visibleFrame
        let w: CGFloat = 190
        let h: CGFloat = 56
        let frame = NSRect(x: vis.maxX - w - 16, y: vis.minY + 16, width: w, height: h)

        super.init(contentRect: frame, styleMask: [.borderless, .nonactivatingPanel],
                   backing: .buffered, defer: false)
        level = NSWindow.Level(rawValue: Int(CGWindowLevelForKey(.screenSaverWindow)))
        backgroundColor = .clear
        isOpaque = false
        ignoresMouseEvents = true
        hasShadow = true
        isReleasedWhenClosed = false
        collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .transient]

        buildUI()
    }

    private func buildUI() {
        // Frosted glass container
        let fx = NSVisualEffectView(frame: NSRect(x: 0, y: 0, width: 190, height: 56))
        fx.material = .hudWindow
        fx.blendingMode = .behindWindow
        fx.state = .active
        fx.wantsLayer = true
        fx.layer?.cornerRadius = 12
        fx.layer?.masksToBounds = true
        contentView?.addSubview(fx)

        // Status dot
        dot.frame = NSRect(x: 14, y: 23, width: 10, height: 10)
        dot.wantsLayer = true
        dot.layer?.cornerRadius = 5
        dot.layer?.backgroundColor = NSColor.systemGray.cgColor
        fx.addSubview(dot)

        // Title
        titleLabel.frame = NSRect(x: 32, y: 30, width: 148, height: 16)
        titleLabel.font = .systemFont(ofSize: 12, weight: .semibold)
        titleLabel.textColor = .white
        fx.addSubview(titleLabel)

        // Subtitle
        subtitleLabel.frame = NSRect(x: 32, y: 12, width: 148, height: 14)
        subtitleLabel.font = .systemFont(ofSize: 10)
        subtitleLabel.textColor = NSColor.white.withAlphaComponent(0.55)
        fx.addSubview(subtitleLabel)
    }

    func update(subtitle: String, dotColor: NSColor, pulsing: Bool) {
        subtitleLabel.stringValue = subtitle
        dot.layer?.backgroundColor = dotColor.cgColor

        pulseTimer?.invalidate()
        pulseTimer = nil

        if pulsing {
            pulsePhase = 0
            pulseTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 30.0, repeats: true) { [weak self] _ in
                guard let self else { return }
                self.pulsePhase += 0.12
                let s = CGFloat(sin(self.pulsePhase) * 0.2 + 1.1)
                self.dot.layer?.transform = CATransform3DMakeScale(s, s, 1)
            }
        } else {
            dot.layer?.transform = CATransform3DIdentity
        }
    }
}

// MARK: - Controller

class OverlayController {
    private var edgeWindows: [EdgeGlowWindow] = []
    private let widget: StatusWidget

    init() {
        guard let screen = NSScreen.main else { fatalError("No screen") }
        let f = screen.frame
        let gw: CGFloat = 60  // glow band width

        let edges: [(NSRect, EdgeDirection)] = [
            (NSRect(x: f.minX,        y: f.maxY - gw,   width: f.width,  height: gw),  .top),
            (NSRect(x: f.minX,        y: f.minY,        width: f.width,  height: gw),  .bottom),
            (NSRect(x: f.minX,        y: f.minY,        width: gw,       height: f.height), .left),
            (NSRect(x: f.maxX - gw,   y: f.minY,        width: gw,       height: f.height), .right),
        ]
        for (frame, dir) in edges {
            let w = EdgeGlowWindow(frame: frame, direction: dir)
            edgeWindows.append(w)
            w.orderFront(nil)
        }

        widget = StatusWidget()
        widget.orderFront(nil)
    }

    func handle(_ event: String, tool: String?) {
        switch event {
        case "executing":
            let name = (tool ?? "tool").replacingOccurrences(of: "_", with: " ")
            widget.update(subtitle: name, dotColor: .jarvisGreen, pulsing: true)
            edgeWindows.forEach { $0.activate(color: .jarvisGreen) }

        case "thinking":
            widget.update(subtitle: "thinking…", dotColor: .jarvisBlue, pulsing: true)
            edgeWindows.forEach { $0.activate(color: .jarvisBlue) }

        case "error":
            widget.update(subtitle: "error", dotColor: .jarvisRed, pulsing: false)
            edgeWindows.forEach { $0.activate(color: .jarvisRed) }
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in
                self?.handle("idle", tool: nil)
            }

        default: // idle / done
            widget.update(subtitle: "idle", dotColor: NSColor.systemGray, pulsing: false)
            edgeWindows.forEach { $0.deactivate() }
        }
    }
}

// MARK: - Stdin reader

func startStdinReader(handler: @escaping (String, String?) -> Void) {
    FileHandle.standardInput.readabilityHandler = { fh in
        let data = fh.availableData
        if data.isEmpty {
            // EOF — parent process exited
            DispatchQueue.main.async { NSApp.terminate(nil) }
            return
        }
        guard let str = String(data: data, encoding: .utf8) else { return }
        for line in str.components(separatedBy: "\n") {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            guard !trimmed.isEmpty,
                  let jsonData = trimmed.data(using: .utf8),
                  let msg = try? JSONSerialization.jsonObject(with: jsonData) as? [String: String],
                  let event = msg["event"]
            else { continue }
            DispatchQueue.main.async { handler(event, msg["tool"]) }
        }
    }
}

// MARK: - Entry point

NSApplication.shared.setActivationPolicy(.accessory)  // no Dock icon

let controller = OverlayController()
startStdinReader { event, tool in controller.handle(event, tool: tool) }

NSApplication.shared.run()
