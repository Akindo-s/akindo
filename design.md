# Design System

## 1. Product context

The product is a **local wholesale e-commerce + SaaS platform** designed to connect wholesale sellers with their business customers through a digital storefront and management platform.

The product must support two related experiences:

- **E-commerce:** customers can browse products, review information, place wholesale orders, and manage their purchasing experience.
- **SaaS:** sellers can manage their catalog, orders, customers, and the operational aspects of their wholesale business.

The design system must therefore balance **commercial clarity**, **operational efficiency**, and **simplicity** across both customer-facing and business-facing interfaces.

The product will be available on:

- **Web**
- **Mobile**

The same visual language should be maintained across both platforms while adapting layouts, navigation, spacing, and interaction patterns to the available screen size.

---

## 2. Design principles

The visual system should follow these principles:

### Clarity first

Wholesale commerce often involves many products, prices, quantities, and operational actions. Information hierarchy must remain obvious and easy to scan.

### Clean and modern

The interface should feel contemporary and polished without becoming visually dense or overly decorative.

### Commercial confidence

The visual language should communicate reliability and professionalism appropriate for a platform used to conduct business transactions.

### Efficient interactions

Frequent actions should require minimal cognitive and physical effort. Controls, actions, and navigation should remain predictable across the product.

### Consistency

Components, spacing, typography, colors, states, and interaction patterns should behave consistently across e-commerce and SaaS experiences.

### Responsive by design

The design should not be treated as a desktop interface reduced to a smaller screen. Mobile layouts must be intentionally designed around touch interaction and limited screen space.

---

## 3. Visual direction

The visual direction is based on a **soft, minimal, modern UI** with:

- Warm light surfaces.
- Strong but controlled accent colors.
- Rounded cards and controls.
- Generous spacing.
- Minimal borders.
- Subtle visual hierarchy.
- Simple, recognizable iconography.
- Clear typography with strong contrast between headings and supporting information.

Cards and content sections should feel lightweight rather than heavily elevated.

The interface should avoid unnecessary gradients, excessive shadows, decorative elements, or overly saturated surfaces.

---

## 4. Color system

The **second color palette is the official product palette**.

The first reference represents a simplified version of the same visual identity and should be treated as a compact representation of the primary colors, rather than as a separate design system.

### 4.1 Core palette

| Role | Hex | Purpose |
|---|---|---|
| Primary | `#DAA520` | Primary actions, active states, key highlights and brand emphasis |
| Secondary | `#F8F0E4` | Main light surfaces, backgrounds and supporting UI |
| Tertiary | `#C63A3C` | Destructive actions, warnings, important alerts and secondary emphasis |
| Neutral | `#7E766A` | Secondary text, borders, muted UI and supporting information |

### 4.2 Simplified brand colors

The simplified identity reference uses the following exact colors:

| Color | Hex |
|---|---|
| Cream | `#FFE2C7` |
| Coral | `#FF5A4C` |
| Blue | `#2EAFD0` |
| Yellow | `#FEBA49` |
| Dark neutral | `#3B3B3B` |

These colors represent the simplified principal visual identity. They may be used as supporting brand colors or reference values where appropriate, but the **official UI token system remains based on the second palette**.

### 4.3 Semantic usage

Color should communicate meaning consistently.

- **Primary:** normal emphasis and primary actions.
- **Secondary:** neutral surfaces and supporting areas.
- **Tertiary:** destructive, critical, or high-attention states.
- **Neutral:** secondary information and visual structure.

Semantic states such as success, warning, error, and informational messaging should be defined independently from the core palette when required.

### 4.4 Color usage rules

Primary color should not be applied to large portions of the interface without purpose.

The primary color should generally be reserved for:

- Primary CTAs.
- Active navigation states.
- Important interactive controls.
- Key highlights.
- Selected states.

Text should not use low-contrast combinations merely for visual subtlety. Accessibility must take precedence over aesthetic preference.

---

## 5. Typography

The visual references contain two typography directions:

- **Inter**
- **Plus Jakarta Sans**

For the current design system, **Plus Jakarta Sans is the preferred UI typeface**, matching the main UI reference.

Typography should establish hierarchy through:

- Font size.
- Weight.
- Line height.
- Color.
- Spacing.

### 5.1 Typography hierarchy

| Style | Font | Size | Weight | Purpose |
|---|---|---:|---:|---|
| Display | Plus Jakarta Sans | TBD | TBD | Major page or product-level headings |
| Headline | Plus Jakarta Sans | TBD | TBD | Section and page headings |
| Body | Plus Jakarta Sans | TBD | TBD | Main content |
| Label | Plus Jakarta Sans | TBD | TBD | Controls, buttons and compact UI |
| Caption | Plus Jakarta Sans | TBD | TBD | Supporting and secondary information |

Exact values should be defined as implementation tokens once the first production screens are finalized.

---

## 6. Layout and spacing

The layout should use a consistent spacing scale.

The visual language favors:

- Generous internal card padding.
- Clear separation between sections.
- Consistent horizontal alignment.
- Large touch targets on mobile.
- Strong grouping of related information.

### 6.1 Spacing tokens

Exact spacing values are still to be formalized.

Recommended token structure:

```text
spacing-1
spacing-2
spacing-3
spacing-4
spacing-5
spacing-6
spacing-8
spacing-10
spacing-12
spacing-16
```

Components should use spacing tokens rather than arbitrary one-off values.

---

## 7. Border radius

Rounded geometry is an important part of the visual language.

The system should use rounded:

- Cards.
- Inputs.
- Buttons.
- Navigation containers.
- Tags and chips.
- Modal and sheet surfaces.

Exact radius tokens remain to be defined, but the system should distinguish between:

- Small radius.
- Standard radius.
- Large card radius.
- Full/circular radius.

---

## 8. Surfaces and elevation

The UI should prefer **subtle separation over heavy elevation**.

Recommended hierarchy:

1. Base background.
2. Surface/card.
3. Elevated or interactive surface.
4. Modal/dialog surface.

Shadows should be soft and used sparingly.

Borders may be used when needed to clarify boundaries, but should not dominate the interface.

---

## 9. Components

The component system should provide reusable primitives shared across the e-commerce and SaaS experiences.

### 9.1 Buttons

The visual reference defines four initial variants:

- Primary
- Secondary
- Inverted
- Outlined

Each button variant must define:

- Default.
- Hover.
- Pressed.
- Focus.
- Disabled.
- Loading.

Buttons should clearly communicate hierarchy so that a screen does not contain multiple competing primary actions.

### 9.2 Inputs

Form controls should use the same visual language as buttons and cards.

Supported controls should include:

- Text input.
- Search input.
- Number input.
- Select.
- Date input.
- Text area.
- Checkbox.
- Radio.
- Toggle.

Inputs must clearly distinguish between:

- Default.
- Focus.
- Filled.
- Error.
- Disabled.
- Read-only.

### 9.3 Search

Search is an important interaction for the e-commerce experience and should prioritize:

- Fast recognition.
- Clear input affordance.
- Visible search icon.
- Easy editing.
- Mobile-friendly interaction.

### 9.4 Navigation

Navigation should adapt according to platform.

#### Web

Navigation may use:

- Sidebar navigation.
- Top navigation.
- Contextual navigation.

#### Mobile

Navigation should prioritize:

- Bottom navigation when appropriate.
- Compact top-level navigation.
- Easy thumb access.
- Clear active states.

The exact navigation model depends on the final information architecture.

### 9.5 Cards

Cards are a major structural element of the visual system.

Cards should provide:

- Clear grouping.
- Consistent padding.
- Consistent radius.
- Controlled visual hierarchy.
- Minimal elevation.

Potential uses include:

- Product previews.
- Orders.
- Customers.
- Analytics summaries.
- SaaS management sections.
- Notifications.

### 9.6 Product components

The e-commerce side should define reusable product components such as:

- Product card.
- Product image.
- Product information.
- Price.
- Wholesale quantity.
- Quantity selector.
- Add-to-cart action.
- Product detail sections.
- Stock/status indicator.

### 9.7 Order components

The order experience should provide reusable patterns for:

- Order summary.
- Order item.
- Quantity.
- Pricing.
- Order status.
- Order totals.
- Order actions.
- Order history.

### 9.8 Labels, badges and chips

The visual language includes compact labels and tags.

These should be used for:

- Status.
- Categories.
- Filters.
- Metadata.
- Compact actions.

Their semantic meaning must remain consistent throughout the product.

### 9.9 Action buttons

Compact icon buttons should be available for frequent secondary actions.

Every icon button must have:

- A clear visual affordance.
- A recognizable icon.
- Accessible labeling.
- Consistent sizing.

---

## 10. Status and semantic colors

The system must distinguish between visual brand colors and semantic states.

The following semantic categories should eventually be defined:

| State | Purpose |
|---|---|
| Success | Completed or successful operation |
| Warning | Attention required but not necessarily destructive |
| Error | Failed or invalid operation |
| Info | Neutral informational message |
| Pending | Operation awaiting completion |

These colors should be accessible and should never rely exclusively on color to communicate meaning.

---

## 11. Iconography

Icons should follow a consistent minimal visual style.

Recommended characteristics:

- Simple shapes.
- Consistent stroke weight.
- Rounded visual language where appropriate.
- Clear silhouette at small sizes.
- Consistent sizing within controls.

A single icon library should be selected for production to avoid visual inconsistencies.

The final library is still to be defined.

---

## 12. Responsive behavior

### 12.1 Mobile

Mobile interfaces should prioritize:

- Touch interaction.
- Vertical content flow.
- Large enough interactive targets.
- Reduced simultaneous information.
- Persistent or easily reachable primary actions.
- Bottom navigation where applicable.

Dense tables should be transformed into cards, stacked information, or horizontally scrollable regions when necessary.

### 12.2 Web

Web interfaces may take advantage of:

- Multi-column layouts.
- Persistent navigation.
- Expanded tables.
- Side panels.
- Larger information density.

The SaaS dashboard may use denser layouts than the consumer-facing storefront while preserving the same design tokens.

---

## 13. E-commerce UX principles

The storefront should optimize for:

- Product discovery.
- Product comparison.
- Clear wholesale pricing.
- Quantity selection.
- Fast ordering.
- Cart visibility.
- Order transparency.
- Repeat purchasing.

Important information such as:

- Price.
- Minimum quantity.
- Availability.
- Product status.
- Order quantity.

should be visually prominent.

---

## 14. SaaS UX principles

The seller-facing SaaS experience should optimize for:

- Operational efficiency.
- Information density without clutter.
- Fast access to frequent actions.
- Clear status visibility.
- Easy management of products, customers, and orders.

Dashboards should prioritize useful summaries over decorative analytics.

Tables, filters, search, sorting, bulk actions, and contextual actions should follow consistent patterns.

---

## 15. Accessibility

Accessibility is part of the design system rather than a final implementation step.

The product should account for:

- Sufficient text and UI contrast.
- Keyboard navigation on web.
- Visible focus states.
- Accessible labels for icon-only controls.
- Adequate touch targets on mobile.
- Readable font sizes.
- Semantic HTML where applicable.
- Color-independent communication of status.

---

## 16. Motion and interaction

Motion should be subtle and functional.

Transitions may communicate:

- State changes.
- Navigation.
- Opening and closing surfaces.
- Success or failure.
- Loading.

Animations should not distract from commercial or operational tasks.

Exact durations and easing curves remain to be defined as implementation tokens.

---

## 17. Design tokens

The final implementation should centralize visual decisions into reusable tokens.

The token system should eventually include:

```text
colors/
typography/
spacing/
radius/
shadows/
borders/
sizes/
breakpoints/
motion/
```

Components should consume these tokens rather than defining isolated visual values.

---

## 18. Platform consistency

The web and mobile applications should share:

- Color tokens.
- Typography principles.
- Component semantics.
- Iconography.
- Naming conventions.
- Interaction meaning.
- Brand personality.

They may differ in:

- Layout.
- Navigation.
- Information density.
- Interaction mechanics.
- Component dimensions.

The goal is **one product identity expressed through platform-appropriate interfaces**, rather than two unrelated visual systems.

---

## 19. Current design decisions

The following decisions are currently established:

| Decision | Status |
|---|---|
| Product type | Local wholesale e-commerce + SaaS |
| Platforms | Web + Mobile |
| Official UI palette | Second reference |
| Simplified brand palette | First reference |
| Primary UI typeface | Plus Jakarta Sans |
| Visual direction | Clean, modern, soft and minimal |
| Card style | Rounded and lightweight |
| Primary component variants | Defined conceptually |
| Responsive approach | Platform-specific layouts using shared design tokens |

---

## 20. Open decisions

The following details still need to be finalized before the design system can be considered implementation-ready:

- Exact typography sizes and weights.
- Exact spacing scale.
- Exact border-radius tokens.
- Shadow/elevation tokens.
- Semantic success/warning/error/info colors.
- Icon library.
- Web breakpoints.
- Mobile navigation structure.
- Final component inventory.
- Button and input dimensions.
- Interaction states and motion tokens.
- Accessibility targets and validation process.
- Relationship between brand colors and semantic UI colors where the simplified palette is used.
