export const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 py-4 px-12 mt-auto transition-colors">
      <div className="flex items-center justify-between">
        <a href="http://www.aigproinc.ca" target="_blank">
          <div
            className="text-base font-semibold text-[#6B6B6B] dark:text-gray-400"
            style={{ fontFamily: "Quicksand" }}
          >
            Powered by AIG Pro Inc
          </div>
        </a>

        <div className="flex items-center gap-6">
          <a
            href="/terms-conditions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold text-[#2A4467] dark:text-blue-400 hover:underline transition-colors"
            style={{ fontFamily: "Quicksand" }}
          >
            Terms & Conditions
          </a>
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold text-[#2A4467] dark:text-blue-400 hover:underline transition-colors"
            style={{ fontFamily: "Quicksand" }}
          >
            Privacy Policy
          </a>
          <a
            href="/contact-us"
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold text-[#2A4467] dark:text-blue-400 hover:underline transition-colors"
            style={{ fontFamily: "Quicksand" }}
          >
            Contact Us
          </a>
          <a
            href="/disclaimer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold text-[#2A4467] dark:text-blue-400 hover:underline transition-colors"
            style={{ fontFamily: "Quicksand" }}
          >
            Disclaimer
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
