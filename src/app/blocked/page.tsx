// src/app/blocked/page.tsx

export default function BlockedPage() {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        fontFamily: "system-ui",
      }}
    >
      <h1>Access Denied</h1>
      <p>Your IP address has been blocked.</p>
    </div>
  );
}
