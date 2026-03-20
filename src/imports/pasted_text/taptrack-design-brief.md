DESIGN BRIEF: "Project TapTrack" — Frictionless Financial Logging App
To: UI/UX Designer
From: Senior Product Designer / Product Owner
Role Context: You are designing a financial tracking app built to eliminate "chore fatigue," user dropout, and data entry friction. The entire UX psychology is based on extreme minimalism, speed, and positive behavioral reinforcement.

1. Core Concept & The "Back Tap" Mechanic
The app's entirely unique selling point is how data is entered. Users will map their iPhone's physical "Back Tap" accessibility feature to launch this app.

The Goal: The moment they double-tap the back of their phone, an overlay immediately appears, allowing them to log an expense in under 3 seconds and under 3 taps.
The Vibe: High-end security meets effortless minimalism, guided by a subtle, friendly avatar (a puppy).
2. Step-by-Step User Flow (Back Tap to Success)
State 1: Contextual Auto-Guess Overlay (Triggered by Back Tap)

The app opens immediately to a bottom-sheet overlay.
Frictionless Logic: The app uses time-of-day and GPS to guess the category. (e.g., If it's 8:00 AM at a Starbucks GPS pin, the category dropdown is pre-filled with "Food/Coffee").
The UI: The focus is instantly on a large, sleek, calculator-style Numpad. There is NO alphabetical keyboard visible.
State 2: The Input (Max 3 Interactions)

Interaction 1: User types the price on the Numpad (e.g., "5" "0" "0").
(Optional) Interaction 2: If the auto-guessed category is wrong, they tap the category dropdown (e.g., "Food") and scroll to select "Transportation." Only if they hit a "+" to add a custom category does a standard QWERTY keyboard slide up. Otherwise, it defaults back to the Numpad immediately.
Interaction 3: User hits a prominent, satisfying "Save/Enter" button.
State 3: Positive Reinforcement (Success State)

The overlay collapses.
The "Puppy" Integration: A very subtle, sophisticated 2D or 3D puppy avatar appears briefly (perhaps nodding, wagging its tail, or giving a tiny high-five). It provides a micro-dopamine hit of positive reinforcement. It must instantly disappear so as not to slow down the user.
3. Visual Style Guide (Professional Secure + Friendly Minimalist)
We must avoid looking like a "cheap game" while still incorporating the puppy avatar. It must invoke the trust of Apple Wallet with the friendliness of Duolingo (but much more subdued).

Color Palette:
Backgrounds: Pure clean whites (#FFFFFF) or very deep, sleek blacks/dark grays (#121212) for dark mode. High contrast, lots of negative whitespace to prevent clutter.
Accents: Use a muted, premium primary color (like a soft sage green, deep navy blue, or muted lavender) for primary buttons and the pie chart.
Finance Colors: Positive and negative numbers should not scream neon red or bright green. Use a muted charcoal or faded gray for the negative/spent amounts so they don't induce anxiety.
Typography: Clean, geometric sans-serif (e.g., Inter, SF Pro, or Roobert). High legibility for numbers.
The Avatar: The puppy should be designed in a flat, minimalist vector style or a sleek monochrome 3D style. It should feel like a premium brand mascot, not a cartoon character.
4. Core Screens to Design
Screen A: The Onboarding (Back Tap Setup)
1 to 2 ultra-minimalist tutorial screens displaying a looping animation or graphic showing the user exactly how to navigate to Settings > Accessibility > Back Tap in iOS to link the app.
Screen B: The Main Feed (List View)
Top Header: A clean display of "Total Spent This Month: $X."
Navigation: A sleek top toggle switch (Tabs: [ List ] | [ Pie Chart ]).
The Feed: A vertical scroll of months (October, November).
Transaction UI: Name of the item/category on the left. The amount spent is pushed to the far right. The numbers should be subtle and slightly faded. Do not use bold red font for expenses. We want them to know what they spent without screaming it at them.
Screen C: The Analytics (Pie Chart View)
Switched via the top toggle.
A beautifully clean, minimalist donut/pie chart showing categorical spending (Food, Utilities, Personal Use).
A legend below the chart breaking down the totals elegantly.
Screen D: Settings / Export (Mini Screen)
A smaller, straightforward settings page.
Must include clear, simple buttons for: "Export My Data" and "Send Feedback."
5. Behavioral Psychology logic: Handling "The Ostrich Effect"
The "Ostrich Effect" in behavioral finance is when users bury their heads in the sand and stop checking their app because they feel guilty about overspending.

Design Strategy for the Designer:

No Red Alarms: When a user exceeds their monthly budget, the UI must not turn red or show warning signs.
Avatar Empathy: If the user logs an expense that pushes them over budget, the puppy avatar should not look angry, sad, or disappointed. Instead, it should appear encouraging—perhaps holding a little "You've got this!" sign or looking determined.
UI Softening: Keep the numbers in their subtle, muted gray tones. The goal is data visualization without judgment.
(Let your designer know that the absolute highest priority of this brief is the speed of the Numpad interaction. The app should feel as native and fast as the iOS calculator!)