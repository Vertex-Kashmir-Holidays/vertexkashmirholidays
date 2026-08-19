/**
 * Flags interactive elements whose only visible content is an icon and which
 * therefore expose no accessible name to a screen reader.
 *
 * `jsx-a11y/control-has-associated-label` cannot catch these: every icon in
 * this codebase is a custom component (`lucide-react`, `@/components/icons/*`),
 * and that rule conservatively assumes an unknown component might itself supply
 * a label — so an icon-only `<button><Trash2 /></button>` passes it silently.
 *
 * An element is reported only when *all* of its children are icons. Anything
 * that could render text (raw text, `{value}`, a `<span>`, an `<Image>` with
 * `alt`) makes it non-icon-only, so the rule errs toward silence rather than
 * false positives.
 */

const INTERACTIVE = new Set(["button", "a", "Link", "Button"]);
const LABEL_ATTRIBUTES = new Set(["aria-label", "aria-labelledby", "title"]);
const ICON_MODULE = /(^|\/)icons(\/|$)/;
const SR_ONLY = /sr-only|visually-hidden|screen-reader/;

function attributeName(attribute) {
  const { name } = attribute;
  if (!name) return null;
  return name.type === "JSXNamespacedName" ? `${name.namespace.name}:${name.name.name}` : name.name;
}

function elementName(node) {
  const name = node.type === "JSXElement" ? node.openingElement.name : node.name;
  if (!name) return null;
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression") return null;
  return null;
}

/** `<svg>` is an icon unless it carries its own `<title>`. */
function svgHasTitle(node) {
  return (node.children ?? []).some(
    (child) => child.type === "JSXElement" && elementName(child) === "title"
  );
}

function hasSrOnlyDescendant(node, sourceCode) {
  for (const child of node.children ?? []) {
    if (child.type !== "JSXElement") continue;
    const className = child.openingElement.attributes.find(
      (attribute) =>
        attribute.type === "JSXAttribute" && attributeName(attribute) === "className"
    );
    if (className?.value && SR_ONLY.test(sourceCode.getText(className.value))) return true;
    if (hasSrOnlyDescendant(child, sourceCode)) return true;
  }
  return false;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require an accessible label on interactive elements whose only content is an icon.",
    },
    schema: [],
    messages: {
      missingLabel:
        "Icon-only <{{tag}}> has no accessible name. Add an aria-label describing the action.",
    },
  },

  create(context) {
    const icons = new Set();
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      Program(program) {
        for (const statement of program.body) {
          if (statement.type !== "ImportDeclaration") continue;
          const source = statement.source.value;
          if (source !== "lucide-react" && !ICON_MODULE.test(source)) continue;
          for (const specifier of statement.specifiers) {
            if (specifier.type === "ImportSpecifier" || specifier.type === "ImportDefaultSpecifier") {
              icons.add(specifier.local.name);
            }
          }
        }
      },

      JSXElement(node) {
        const tag = elementName(node);
        if (!tag || !INTERACTIVE.has(tag)) return;

        const attributes = node.openingElement.attributes;
        // A spread may carry aria-label; don't guess.
        if (attributes.some((attribute) => attribute.type === "JSXSpreadAttribute")) return;
        if (
          attributes.some(
            (attribute) =>
              attribute.type === "JSXAttribute" && LABEL_ATTRIBUTES.has(attributeName(attribute))
          )
        ) {
          return;
        }
        if (hasSrOnlyDescendant(node, sourceCode)) return;

        const isIcon = (child) => {
          if (child.type !== "JSXElement" && child.type !== "JSXFragment") return false;
          const name = elementName(child);
          if (name === "svg") return !svgHasTitle(child);
          return Boolean(name) && icons.has(name);
        };

        let sawIcon = false;
        for (const child of node.children) {
          if (child.type === "JSXText") {
            if (child.value.trim()) return;
            continue;
          }
          if (isIcon(child)) {
            sawIcon = true;
            continue;
          }
          if (child.type === "JSXExpressionContainer") {
            if (child.expression.type === "JSXEmptyExpression") continue;
            // Only a conditional that renders nothing but icons stays icon-only.
            const nested = [];
            let rendersText = false;
            const walk = (n) => {
              if (!n || typeof n.type !== "string" || rendersText) return;
              if (n.type === "JSXElement" || n.type === "JSXFragment") {
                nested.push(n);
                return;
              }
              if (n.type === "Literal" && typeof n.value === "string" && n.value.trim()) {
                rendersText = true;
                return;
              }
              if (n.type === "TemplateLiteral") {
                rendersText = true;
                return;
              }
              for (const key of Object.keys(n)) {
                if (key === "parent") continue;
                const value = n[key];
                if (Array.isArray(value)) value.forEach(walk);
                else if (value && typeof value.type === "string") walk(value);
              }
            };
            walk(child.expression);
            if (rendersText || nested.length === 0) return;
            if (!nested.every(isIcon)) return;
            sawIcon = true;
            continue;
          }
          return;
        }

        if (sawIcon) {
          context.report({ node: node.openingElement, messageId: "missingLabel", data: { tag } });
        }
      },
    };
  },
};
