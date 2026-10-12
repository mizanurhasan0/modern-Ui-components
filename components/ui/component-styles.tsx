type ComponentStylesProps = {
  /** The component's scoped CSS, included in its portable source. */
  css: string;
};

/**
 * Register static component CSS as a React stylesheet resource. React can reuse
 * the server-rendered style even if an extension adds attributes before hydration.
 * A content fingerprint allows edited styles to update during Fast Refresh.
 */
export function ComponentStyles({ css }: ComponentStylesProps) {
  let fingerprint = 2166136261;
  for (let index = 0; index < css.length; index += 1) {
    fingerprint = Math.imul(fingerprint ^ css.charCodeAt(index), 16777619);
  }

  return (
    <style
      href={`component-lab-${(fingerprint >>> 0).toString(36)}-${css.length}`}
      precedence="components"
    >
      {css}
    </style>
  );
}
