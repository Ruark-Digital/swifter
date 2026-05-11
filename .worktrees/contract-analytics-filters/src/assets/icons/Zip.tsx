export const ZipSVG = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    width={48}
    height={48}
    fill="none"
    {...props}
  >
    <rect width={48} height={48} rx={8} fill="#F3E8FF" />
    <path
      d="M14 14h20v20H14V14zm2 2v4h4v-4h-4zm6 0v4h4v-4h-4zm6 0v4h4v-4h-4zm-12 6v4h4v-4h-4zm6 0v4h4v-4h-4zm6 0v4h4v-4h-4zm-12 6v4h4v-4h-4zm6 0v4h4v-4h-4zm6 0v4h4v-4h-4z"
      fill="#9333EA"
    />
    <path
      d="M24 16v16M16 24h16"
      stroke="#F3E8FF"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </svg>
);

export default ZipSVG;