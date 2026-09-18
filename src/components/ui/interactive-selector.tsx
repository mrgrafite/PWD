import { useEffect, useState, type CSSProperties } from "react";
import { FaCampground, FaFire, FaHiking, FaHotTub, FaTint } from "react-icons/fa";
import AliMark from "@/components/AliMark";

// Paleta oficial ALI Tecnologia (reference_ali_identidade_visual)
const ALI = {
  petrolGreen: "#315D59",
  deepForest: "#173F38",
  forestBlack: "#0E211D",
  terracotta: "#9A6048",
  warmCamel: "#B78A61",
  warmIvory: "#F2EEE5",
  sand: "#D8C5AA",
};

interface SelectorOption {
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
}

const options: SelectorOption[] = [
  {
    title: "Luxury Tent",
    description: "Cozy glamping under the stars",
    image:
      "https://cdn.21st.dev/assets/mirror/31/31ee902b46038d690f949a8be82c4b5673d554eac7456974c04950d78b4efe3d.jpg",
    icon: <FaCampground size={22} className="text-white" />,
  },
  {
    title: "Campfire Feast",
    description: "Gourmet s'mores & stories",
    image:
      "https://cdn.21st.dev/assets/mirror/3b/3b6c78ba5a375a240a6452b7c68a889228d52aba6e18e355b77f04472e4e0e76.jpg",
    icon: <FaFire size={22} className="text-white" />,
  },
  {
    title: "Lakeside Retreat",
    description: "Private dock & canoe rides",
    image:
      "https://cdn.21st.dev/assets/mirror/97/97103cb7b8ac5adbbd3e64c7410560b04a83b056daa580ee1b0353f774ec8d3d.jpg",
    icon: <FaTint size={22} className="text-white" />,
  },
  {
    title: "Mountain Spa",
    description: "Outdoor sauna & hot tub",
    image:
      "https://cdn.21st.dev/assets/mirror/9f/9fff1299ab7c6ec1a4b42e57e2ec6853fee03efe144bb054a494ec9c1e145d23.jpg",
    icon: <FaHotTub size={22} className="text-white" />,
  },
  {
    title: "Guided Adventure",
    description: "Expert-led nature tours",
    image:
      "https://cdn.21st.dev/assets/mirror/9f/9f4d6686c3ee21321e110920cfd3b8109d15f61ab2972dfafdeb1f1b1099c568.jpg",
    icon: <FaHiking size={22} className="text-white" />,
  },
];

const InteractiveSelector = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animatedOptions, setAnimatedOptions] = useState<number[]>([]);

  const handleOptionClick = (index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  useEffect(() => {
    const timers = options.map((_, i) =>
      setTimeout(() => {
        setAnimatedOptions((prev) => [...prev, i]);
      }, 180 * i),
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen text-white"
      style={{ backgroundColor: ALI.deepForest, fontFamily: "'Archivo', sans-serif" }}
    >
      {/* Header Section */}
      <div className="w-full max-w-2xl px-6 mt-8 mb-2 text-center">
        <div className="flex items-center justify-center gap-3 mb-4 animate-fadeInTop delay-300">
          <AliMark className="shrink-0" />
          <span className="text-xs font-semibold tracking-[0.3em] uppercase" style={{ color: ALI.warmCamel }}>
            ALI Tecnologia
          </span>
        </div>
        <h1
          className="text-4xl md:text-5xl font-semibold mb-3 tracking-tight drop-shadow-lg animate-fadeInTop delay-300"
          style={{ color: ALI.warmIvory }}
        >
          Escape in Style
        </h1>
        <p
          className="text-lg md:text-xl font-medium max-w-xl mx-auto animate-fadeInTop delay-600 italic"
          style={{ color: ALI.sand, fontFamily: "'Newsreader', serif" }}
        >
          Discover luxurious camping experiences in nature's most breathtaking spots.
        </p>
      </div>

      <div className="h-12" />

      {/* Options Container */}
      <div className="options flex w-full max-w-[900px] min-w-[600px] h-[400px] mx-0 items-stretch overflow-hidden relative">
        {options.map((option, index) => {
          const isActive = activeIndex === index;
          const style: CSSProperties = {
            backgroundImage: `url('${option.image}')`,
            backgroundSize: isActive ? "auto 100%" : "auto 120%",
            backgroundPosition: "center",
            backfaceVisibility: "hidden",
            opacity: animatedOptions.includes(index) ? 1 : 0,
            transform: animatedOptions.includes(index) ? "translateX(0)" : "translateX(-60px)",
            minWidth: "60px",
            minHeight: "100px",
            margin: 0,
            borderRadius: 0,
            borderWidth: "2px",
            borderStyle: "solid",
            borderColor: isActive ? ALI.terracotta : "rgba(242,238,229,0.14)",
            cursor: "pointer",
            backgroundColor: ALI.forestBlack,
            boxShadow: isActive
              ? `0 20px 60px rgba(14,33,29,0.55), 0 0 0 1px rgba(154,96,72,0.35)`
              : "0 10px 30px rgba(14,33,29,0.35)",
            flex: isActive ? "7 1 0%" : "1 1 0%",
            zIndex: isActive ? 10 : 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            position: "relative",
            overflow: "hidden",
            willChange: "flex-grow, box-shadow, background-size, background-position",
          };

          return (
            <div
              key={option.title}
              className={`option relative flex flex-col justify-end overflow-hidden transition-all duration-700 ease-in-out ${
                isActive ? "active" : ""
              }`}
              style={style}
              onClick={() => handleOptionClick(index)}
            >
              {/* Shadow effect */}
              <div
                className="shadow absolute left-0 right-0 pointer-events-none transition-all duration-700 ease-in-out"
                style={{
                  bottom: isActive ? "0" : "-40px",
                  height: "120px",
                  boxShadow: isActive
                    ? "inset 0 -120px 120px -120px #0E211D, inset 0 -120px 120px -80px #0E211D"
                    : "inset 0 -120px 0px -120px #0E211D, inset 0 -120px 0px -80px #0E211D",
                }}
              />

              {/* Label with icon and info */}
              <div className="label absolute left-0 right-0 bottom-5 flex items-center justify-start h-12 z-2 pointer-events-none px-4 gap-3 w-full">
                <div
                  className="icon min-w-[44px] max-w-[44px] h-[44px] flex items-center justify-center rounded-full backdrop-blur-[10px] shadow-[0_1px_4px_rgba(14,33,29,0.4)] border-2 flex-shrink-0 flex-grow-0 transition-all duration-200"
                  style={{ backgroundColor: "rgba(49,93,89,0.85)", borderColor: ALI.warmCamel }}
                >
                  {option.icon}
                </div>
                <div className="info whitespace-pre relative" style={{ color: ALI.warmIvory }}>
                  <div
                    className="main font-semibold text-lg transition-all duration-700 ease-in-out"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translateX(0)" : "translateX(25px)",
                    }}
                  >
                    {option.title}
                  </div>
                  <div
                    className="sub text-base transition-all duration-700 ease-in-out"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translateX(0)" : "translateX(25px)",
                      color: ALI.sand,
                    }}
                  >
                    {option.description}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom animations + tipografia ALI (Archivo/Newsreader) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Newsreader:ital,wght@1,400;1,500&display=swap');

        @keyframes fadeInFromTop {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInTop {
          opacity: 0;
          transform: translateY(-20px);
          animation: fadeInFromTop 0.8s ease-in-out forwards;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }

        .delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  );
};

export default InteractiveSelector;
