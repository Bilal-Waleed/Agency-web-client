import { useEffect } from "react";
import { useLocation } from "react-router";

const ScrollToTop = ({ scrollRef }) => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (scrollRef?.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
