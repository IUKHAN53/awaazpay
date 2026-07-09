<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>AwaazPay</title>
    <style>
        :root { --navy:#1a2e6e; --gold:#f0b429; --cream:#f7f5ef; --ink:#15161a; --muted:#5a5c66; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--cream); color: var(--ink); min-height: 100vh;
            display: flex; align-items: center; justify-content: center; padding: 24px; }
        .card { max-width: 460px; width: 100%; background: #fff; border: 1px solid #eceadf;
            border-radius: 20px; padding: 40px 32px; text-align: center;
            box-shadow: 0 10px 40px rgba(26,46,110,.08); }
        .logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 22px; }
        .tile { width: 48px; height: 48px; border-radius: 13px; background: var(--navy);
            display: flex; align-items: center; justify-content: center; gap: 4px; }
        .tile b { color: #fff; font-weight: 800; font-size: 15px; }
        .bars { display: flex; align-items: flex-end; gap: 3px; }
        .bars i { width: 3px; background: var(--gold); border-radius: 2px; display: block; }
        .wordmark { font-weight: 800; font-size: 24px; letter-spacing: -.5px; color: var(--navy); }
        .wordmark span { color: var(--gold); }
        h1 { font-size: 19px; font-weight: 700; margin-bottom: 8px; }
        .urdu { font-size: 16px; color: var(--muted); margin-bottom: 6px; direction: rtl; }
        p { color: var(--muted); font-size: 14px; line-height: 1.6; margin-bottom: 26px; }
        .status { display: inline-flex; align-items: center; gap: 8px; font-size: 13px;
            font-weight: 600; color: #1e7f4f; background: #e7f2ea; padding: 7px 14px;
            border-radius: 999px; margin-bottom: 26px; }
        .dot { width: 9px; height: 9px; border-radius: 50%; background: #3ddc84; }
        .btn { display: inline-block; background: var(--gold); color: var(--navy);
            font-weight: 700; font-size: 15px; text-decoration: none; padding: 13px 28px;
            border-radius: 13px; box-shadow: 0 3px 0 #c98f10; }
        .foot { margin-top: 24px; font-size: 12px; color: #8a8c96; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">
            <span class="tile">
                <b>Rs</b>
                <span class="bars"><i style="height:7px"></i><i style="height:14px"></i><i style="height:9px"></i><i style="height:5px"></i></span>
            </span>
            <span class="wordmark">Awaaz<span>Pay</span></span>
        </div>
        <div class="status"><span class="dot"></span> API online</div>
        <h1>Payment soundbox for Pakistani shops</h1>
        <div class="urdu">ہر پیمنٹ، بول کے</div>
        <p>This is the AwaazPay backend — it powers staff alerts, parser-template
           updates and payment webhooks for the mobile app.</p>
        <a class="btn" href="/admin">Open admin panel &rsaquo;</a>
        <div class="foot">iukhan.tech</div>
    </div>
</body>
</html>
