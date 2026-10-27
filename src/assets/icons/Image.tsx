export const ImageSVG = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={48}
    height={48}
    fill="none"
    {...props}
  >
    <rect width={48} height={48} rx={8} fill="#E0F2FE" />
    <rect
      x={12}
      y={14}
      width={24}
      height={20}
      rx={2}
      stroke="#0284C7"
      strokeWidth={2}
    />
    <circle cx={19} cy={21} r={2.5} fill="#0284C7" />
    <path
      d="M13 32l7-7 4 4 5-6 6 7"
      stroke="#0284C7"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ImageSVG;
