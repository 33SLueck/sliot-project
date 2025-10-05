// Type declarations for CSS imports in Next.js
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}