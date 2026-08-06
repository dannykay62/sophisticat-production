import { FaInstagram } from "react-icons/fa6";
import ProductImage from "@/components/ui/ProductImage";

const POSTS = [
  {
    imageKey: "jewelry",
    url: "https://www.instagram.com/sophisticat_beautystudio/p/DU9DOUYDEht/",
  },
  {
    imageKey: "turbans",
    url: "https://www.instagram.com/sophisticat_beautystudio/p/DTdkS99jDrO/",
  },
  {
    imageKey: "beaded-bracelets",
    url: "https://www.instagram.com/sophisticat_beautystudio/p/DSk327vjGxN/",
  },
  {
    imageKey: "african-prints-designs",
    url: "https://www.instagram.com/sophisticat_beautystudio/p/DPevK8UDNJO/",
  },
  {
    imageKey: "jewelry",
    url: "https://www.instagram.com/sophisticat_beautystudio/p/DPzC4enjOum/",
  },
  {
    imageKey: "turbans",
    url: "https://www.instagram.com/sophisticat_beautystudio/reel/DTitGm1DMyL/",
  },
];

export default function InstagramFeed() {
  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="container-luxe text-center">
        <span className="eyebrow">Follow Our Journey</span>

        <h2 className="mt-3 text-display-lg text-ink">
          Follow @sophisticat_beautystudio
        </h2>
        
        <p className="mx-auto mt-4 max-w-lg text-sm text-ink/55">
          Discover our latest collections, styling inspiration, and behind-the-scenes moments. Follow us on Instagram and share your Sophisticat look for a chance to be featured.
        </p>
      </div>

      <div className="container-luxe mt-12 grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
        {POSTS.map((post, index) => (
          <a
            key={post.url}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View Sophisticat Instagram post ${index + 1}`}
            className="group relative block overflow-hidden rounded-sm"
          >
            <ProductImage
              imageKey={post.imageKey}
              alt={`Sophisticat Instagram post ${index + 1}`}
              ratio="aspect-square"
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-all duration-300 group-hover:bg-ink/45">
              <FaInstagram className="h-6 w-6 text-cream opacity-0 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}














// import { Instagram } from "lucide-react";
// import ProductImage from "@/components/ui/ProductImage";

// const KEYS = ["jewelry", "turbans", "beaded-bracelets", "african-prints-designs", "jewelry", "turbans"];

// export default function InstagramFeed() {
//   return (
//     <section className="bg-cream py-20 md:py-28">
//       <div className="container-luxe text-center">
//         <span className="eyebrow">Join The Community</span>
//         <h2 className="mt-3 text-display-lg text-ink">@shopsophisticat.com</h2>
//         <p className="mx-auto mt-4 max-w-md text-sm text-ink/55">
//           Tag your favourite Sophisticat moments for a chance to be featured.
//         </p>
//       </div>

//       <div className="container-luxe mt-10 grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
//         {KEYS.map((k, i) => (
//           <a
//             key={i}
//             href="https://www.instagram.com/sophisticat_beautystudio?igsh=ZWRweTBrbXhoamQ2"
//             target="_blank"
//             rel="noreferrer"
//             className="group relative block overflow-hidden"
//           >
//             <ProductImage imageKey={k} alt="Sophisticat Instagram post" ratio="aspect-square" />
//             <div className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors duration-300 group-hover:bg-ink/40">
//               <Instagram className="h-5 w-5 text-cream opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
//             </div>
//           </a>
//         ))}
//       </div>
//     </section>
//   );
// }






// https://www.instagram.com/sophisticat_beautystudio/p/DU9DOUYDEht/

// https://www.instagram.com/sophisticat_beautystudio/p/DTdkS99jDrO/

// https://www.instagram.com/sophisticat_beautystudio/p/DSk327vjGxN/

// https://www.instagram.com/sophisticat_beautystudio/p/DPevK8UDNJO/

// https://www.instagram.com/sophisticat_beautystudio/p/DPzC4enjOum/

// https://www.instagram.com/sophisticat_beautystudio/reel/DTitGm1DMyL/