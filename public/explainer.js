window.DevLensExplainer = {
  explain(style) {
    const parts = [];

    // Layout
    if (style.display === "flex") {
      parts.push(
        "Layout: This element uses Flexbox to arrange its child elements."
      );
    } else if (style.display === "grid") {
      parts.push(
        "Layout: This element uses CSS Grid to arrange content in rows and columns."
      );
    } else {
      parts.push(
        `Layout: This element uses display: ${style.display}.`
      );
    }

    // Position
    if (style.position !== "static") {
      parts.push(
        `Position: This element uses ${style.position} positioning.`
      );
    }

    // Padding
    if (style.padding !== "0px") {
      parts.push(
        `Spacing: The element has inner spacing of ${style.padding}.`
      );
    }

    // Margin
    if (style.margin !== "0px") {
      parts.push(
        `Margin: The element has outside spacing of ${style.margin}.`
      );
    }

    // Typography
    parts.push(
      `Typography: Text size is ${style.fontSize} with font weight ${style.fontWeight}.`
    );

    // Border radius
    if (
      style.borderRadius &&
      style.borderRadius !== "0px"
    ) {
      parts.push(
        `Shape: It has ${style.borderRadius} rounded corners.`
      );
    }

    // Background
    if (
      style.backgroundColor &&
      style.backgroundColor !== "rgba(0, 0, 0, 0)"
    ) {
      parts.push(
        "Color: This element has its own background color."
      );
    }

    return parts.join("\n\n");
  },
};  