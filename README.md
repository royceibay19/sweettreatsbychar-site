# Sweet Treats by Char website

A plain HTML, CSS and JavaScript site. It has no build step and needs nothing installed.

## Files

- `index.html`: all the page content
- `style.css`: colors, fonts and layout. The palette is at the top, under `:root`.
- `main.js`: menu, gallery, form, and the Messenger link setting
- `assets/img/`: the logo and cake photos, already compressed for the web

## Where orders and messages go

- **Every "Order on Messenger" button** opens `https://m.me/100083340789131`. That address is built from your Facebook page ID, so **test it once** on your phone. If it doesn't open a chat with Sweet Treats by Char, change `MESSENGER_URL` at the top of `main.js`. All the buttons update automatically.
- **The inquiry form doesn't send anything by itself.** It checks the answers, writes a ready-made message, copies it, and offers two buttons: "Open Messenger" (the customer pastes the message) and "Send as text" (it opens their SMS app with the message filled in, addressed to +63 966 194 3736). No email or database is involved.
- **"Ask about this cake" links** copy a short note naming that cake, then open Messenger.

## Things to fill in later

- **Pickup hours:** the site says pickup times are "agreed with you when you order". Edit the "Pickup times" line in the Contact section if you want fixed hours.
- **Order lead time:** the site says "Custom and wedding cakes need more time, so message us as early as you can." Change it to a set number of days if you have one.
- **Instagram:** left out until confirmed.
- **Promo prices:** they're from the Ber Months Promo 2026 posters. Update the list in the `PROMO / PRICES` section when the promo ends.

## Editing

- **Cake categories:** copy or delete an `<li>` block in the `CAKE COLLECTION` section.
- **New photo:** put a compressed JPG (about 1600px on the long side) in `assets/img/`, then copy one `gallery__item` block in `SIGNATURE CREATIONS` and change the file name, alt text and caption.

## Photos left out on purpose

The Ferrari cake and the Sofia cake show trademarked logos and characters, so they aren't used. Neither are the promo posters. The posters were used only as the source of the prices.

## Preview

Open the site through a local server, not by double-clicking the file:

```
cd website
python -m http.server 4173
```

Then visit http://localhost:4173.
