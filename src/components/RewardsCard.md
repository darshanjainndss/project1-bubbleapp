# RewardsCard Component - Compact Design

A clean, compact rewards card component for the profile section that displays rewards and withdraw functionality in a minimal, elegant design.

## Features

- **Compact Layout**: Single row design with reward info and withdraw button
- **Responsive Design**: Adapts to different screen sizes (breakpoint at 380px width)
- **Real-time Data**: Fetches and displays current SHIB reward balance
- **Clean UI**: Minimal design that doesn't take up too much space
- **Quick Actions**: Inline withdraw button and history access buttons

## Design

### Main Card
- **Single Row Layout**: Icon + Reward Amount + Withdraw Button
- **Compact Size**: 16px padding, 12px border radius
- **Subtle Background**: `rgba(255, 255, 255, 0.05)` with green border accent

### History Buttons
- **Two Button Row**: Rewards History | Withdraw History
- **Equal Width**: Each button takes 50% width with 8px gap
- **Icon + Text**: Small icons with descriptive text

## Layout Structure

```
┌─────────────────────────────────────────────────┐
│ [⚡] 1234.5678 SHIB          [💳 WITHDRAW]      │
│     Available Rewards                           │
└─────────────────────────────────────────────────┘
┌─────────────────────┐ ┌─────────────────────────┐
│ [📜] Rewards        │ │ [📋] Withdrawals        │
└─────────────────────┘ └─────────────────────────┘
```

## Responsive Sizing

### Large Screens (>380px)
- Font sizes: 16px reward amount, 12px buttons
- Icon container: 32px
- Button padding: 8px vertical, 12px horizontal

### Small Screens (≤380px)  
- Font sizes: 14px reward amount, 11px buttons
- Icon container: 32px (same)
- Button padding: 8px vertical, 12px horizontal

## Colors
- **Reward Amount**: `#00FF88` (Green)
- **Withdraw Button**: `#00FF88` background
- **History Buttons**: Subtle white background with colored icons
- **Border**: `rgba(0, 255, 136, 0.2)` (Green accent)

This design is much more compact and fits better within the profile popup without taking up excessive space.