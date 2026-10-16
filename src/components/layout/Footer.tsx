import { site } from "@/content/site";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <p>{site.rodape}</p>
      </div>
    </footer>
  );
}
