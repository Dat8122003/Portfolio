import { Link } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";

const NotFound = () => {
  const { t } = useTheme();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center dark:bg-black">
      <h1 className="text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">404</h1>
      <p className="text-zinc-500 dark:text-zinc-400">Trang không tồn tại</p>
      <Link
        to="/"
        className="btn-magnetic rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-white"
      >
        {t.nav.about}
      </Link>
    </main>
  );
};

export default NotFound;
