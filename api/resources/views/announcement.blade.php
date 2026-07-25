<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Opening Agapay…</title>
    <script>
        // Bounce the visitor into the Agapay app.
        window.location.replace("{{ $deepLink }}");
    </script>
    <style>
        body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #eef2f7; color: #0b1220; }
        .box { text-align: center; padding: 32px; }
        .logo { width: 56px; height: 56px; border-radius: 16px; background: #0038a8; color: #fff; font-weight: 800;
            display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 20px; }
        a { display: inline-block; margin-top: 16px; background: #0038a8; color: #fff; text-decoration: none;
            padding: 12px 20px; border-radius: 12px; font-weight: 600; }
        p { color: #5b6472; }
    </style>
</head>
<body>
    <div class="box">
        <div class="logo">AL</div>
        <h2>Opening Agapay…</h2>
        <p>If the app does not open automatically, tap below.</p>
        <a href="{{ $deepLink }}">Open the Agapay app</a>
    </div>
</body>
</html>
