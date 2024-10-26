export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-12 mx-auto max-w-7xl px-4">
      {children}
    </div>
  );
}
