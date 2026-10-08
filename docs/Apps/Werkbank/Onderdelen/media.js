// Keep media portable: images use Markdown, videos remain ordinary YouTube links.
function youtubeId(value) {
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
        let id;
        if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
        else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
            id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)\/?$/)?.[1];
        }
        return /^[\w-]{11}$/.test(id || '') ? id : null;
    } catch { return null; }
}

function renderYouTubePlayers(root) {
    if (!root) return;
    root.querySelectorAll('p').forEach(paragraph => {
        const link = paragraph.firstElementChild;
        if (paragraph.children.length !== 1 || link?.tagName !== 'A' || paragraph.textContent.trim() !== link.textContent.trim()) return;
        const id = youtubeId(link.href);
        if (!id) return;
        const button = document.createElement('button');
        I18n.assign(button,I18n.ui("▶ YouTube-video afspelen",'▶ YouTube-video afspelen'),"textContent");
        button.style.cssText = 'display:block;width:100%;aspect-ratio:16/9;border:1px solid #888;border-radius:8px;background:#181818;color:white;font:inherit;cursor:pointer;margin-bottom:8px';
        button.onclick = () => {
            const frame = document.createElement('iframe');
            frame.src = 'https://www.youtube-nocookie.com/embed/' + id;
            I18n.assign(frame,I18n.ui("YouTube-video",'YouTube-video'),"title");
            frame.allow = 'encrypted-media; picture-in-picture; fullscreen';
            frame.allowFullscreen = true;
            frame.referrerPolicy = 'strict-origin-when-cross-origin';
            frame.style.cssText = 'display:block;width:100%;aspect-ratio:16/9;border:0;margin-bottom:8px';
            button.replaceWith(frame);
        };
        paragraph.prepend(button);
        link.target = '_blank'; link.rel = 'noopener noreferrer';
    });
}

function openMediaDialog(kind) {
    const editor = document.getElementById('wysiwygEditor');
    if (!editor) return;
    const selection = window.getSelection();
    const savedRange = selection.rangeCount && editor.contains(selection.getRangeAt(0).commonAncestorContainer) ? selection.getRangeAt(0).cloneRange() : null;
    const dialog = document.createElement('dialog');
    dialog.className = 'writing-media-dialog';
    dialog.setAttribute('aria-labelledby', 'writing-media-title');
    if (!document.getElementById('writing-media-style')) {
        const style = document.createElement('style'); style.id = 'writing-media-style';
        I18n.assign(style,I18n.ui("\n        dialog\n        \n        .writing-media-dialog form{display:grid;gap:22px;margin:0}\n        \n        .writing-media-dialog p{margin:0}\n        .writing-media-dialog label{display:block;font-weight:600}\n        .writing-media-dialog input[type=url],.writing-media-dialog input[type=text]{display:block;box-sizing:border-box;width:100%;min-width:0;margin:8px 0 0;padding:12px 14px;border:1px solid #999;border-radius:4px;background:#fff;color:#111;font:400 16px/1.5 Arial,sans-serif;box-shadow:none;clip-path:none;appearance:none}\n        .writing-media-dialog button{appearance:none;font:600 15px/1.4 Arial,sans-serif;min-height:44px;padding:11px 18px;border:1px solid #777;border-radius:4px;background:#fff;color:#111;cursor:pointer}\n        .writing-media-dialog button[type=submit]{background:#111;color:#fff;border-color:#111}\n        .writing-media-dialog .media-hint{font-size:14px;color:#555;margin-top:8px}\n        .writing-media-dialog .media-file-row{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:10px}\n        .writing-media-dialog [data-file-name]{font-size:14px;overflow-wrap:anywhere;min-width:0;flex:1}\n        .writing-media-dialog summary{cursor:pointer;font-weight:600}\n        .writing-media-dialog details label{margin-top:14px}\n        \n        .writing-media-dialog [role=alert]{color:#a31515;font-size:14px}\n        .writing-media-dialog [role=alert]:empty{display:none}\n        .writing-media-dialog :focus-visible{outline:3px solid var(--wp-accent,#e32720);outline-offset:3px}\n        .writing-media-dialog button:disabled{opacity:.5;cursor:wait}\n        .writing-media-dialog [hidden]{display:none!important}\n        @media(max-width:480px){dialog}\n        ",`
        dialog

        .writing-media-dialog form{display:grid;gap:22px;margin:0}

        .writing-media-dialog p{margin:0}
        .writing-media-dialog label{display:block;font-weight:600}
        .writing-media-dialog input[type=url],.writing-media-dialog input[type=text]{display:block;box-sizing:border-box;width:100%;min-width:0;margin:8px 0 0;padding:12px 14px;border:1px solid #999;border-radius:4px;background:#fff;color:#111;font:400 16px/1.5 Arial,sans-serif;box-shadow:none;clip-path:none;appearance:none}
        .writing-media-dialog button{appearance:none;font:600 15px/1.4 Arial,sans-serif;min-height:44px;padding:11px 18px;border:1px solid #777;border-radius:4px;background:#fff;color:#111;cursor:pointer}
        .writing-media-dialog button[type=submit]{background:#111;color:#fff;border-color:#111}
        .writing-media-dialog .media-hint{font-size:14px;color:#555;margin-top:8px}
        .writing-media-dialog .media-file-row{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:10px}
        .writing-media-dialog [data-file-name]{font-size:14px;overflow-wrap:anywhere;min-width:0;flex:1}
        .writing-media-dialog summary{cursor:pointer;font-weight:600}
        .writing-media-dialog details label{margin-top:14px}

        .writing-media-dialog [role=alert]{color:#a31515;font-size:14px}
        .writing-media-dialog [role=alert]:empty{display:none}
        .writing-media-dialog :focus-visible{outline:3px solid var(--wp-accent,#e32720);outline-offset:3px}
        .writing-media-dialog button:disabled{opacity:.5;cursor:wait}
        .writing-media-dialog [hidden]{display:none!important}
        @media(max-width:480px){dialog}
        `),"textContent"); document.head.append(style);
    }
    const isImage = kind === 'image';
    const urlField = "<label>"+(isImage ? I18n.t('Webadres van de afbeelding') : 'YouTube-link')+"<input name=\"url\" type=\"url\" placeholder=\"https://\" data-i18n-placeholder=\"https://\"></label>";
    dialog.innerHTML = "<form><h2 id=\"writing-media-title\">"+(isImage ? I18n.t('Afbeelding toevoegen') : I18n.t('YouTube-video toevoegen'))+"</h2>\n        "+(isImage ? "<section><label for=\"writing-media-file\"><span data-i18n=\"Afbeelding op je computer\">Afbeelding op je computer</span></label><input id=\"writing-media-file\" name=\"file\" type=\"file\" accept=\"image/png,image/jpeg,image/gif,image/webp\" hidden><div class=\"media-file-row\"><button type=\"button\" data-pick><span data-i18n=\"Kies afbeelding\">Kies afbeelding</span></button><span data-file-name aria-live=\"polite\"><span data-i18n=\"Nog geen bestand gekozen\">Nog geen bestand gekozen</span></span></div><p class=\"media-hint\"><span data-i18n=\"PNG, JPG, GIF of WebP · maximaal 2 MB\">PNG, JPG, GIF of WebP · maximaal 2 MB</span></p></section><details><summary><span data-i18n=\"Of gebruik een webadres\">Of gebruik een webadres</span></summary>"+(urlField)+"</details><label><span data-i18n=\"Beschrijving\">Beschrijving</span> <span class=\"media-hint\"><span data-i18n=\"(optioneel)\">(optioneel)</span></span><input name=\"description\" type=\"text\" placeholder=\"Wat is er op de afbeelding te zien?\" data-i18n-placeholder=\"Wat is er op de afbeelding te zien?\"></label><p class=\"media-hint\"><span data-i18n=\"Een gekozen bestand wordt onderdeel van je document. Klik na het toevoegen op Bewaar alles om je werk te bewaren.\">Een gekozen bestand wordt onderdeel van je document. Klik na het toevoegen op Bewaar alles om je werk te bewaren.</span></p>" : (urlField)+"<p class=\"media-hint\"><span data-i18n=\"Je kunt de video afspelen in de leesweergave.\">Je kunt de video afspelen in de leesweergave.</span></p>")+"\n        <p role=\"alert\"></p><div class=\"media-actions wp-actions\"><button type=\"button\" data-cancel><span data-i18n=\"Annuleer\">Annuleer</span></button><button class=\"action-primary\" type=\"submit\"><span data-i18n=\"Toevoegen\">Toevoegen</span></button></div></form>";
    document.body.append(dialog);
    if (isImage) {
        const form = dialog.querySelector('form');
        dialog.querySelector('[data-pick]').onclick = () => form.elements.file.click();
        form.elements.file.onchange = () => {
            const file = form.elements.file.files[0];
            I18n.assign(dialog.querySelector('[data-file-name]'),(file?file.name:I18n.ui("Nog geen bestand gekozen",'Nog geen bestand gekozen')),"textContent");
            if (file) { form.elements.url.value = ''; dialog.querySelector('details').open = false; }
            form.querySelector('[role=alert]').textContent = '';
        };
        form.elements.url.oninput = () => {
            if (form.elements.url.value.trim()) { form.elements.file.value = ''; I18n.assign(dialog.querySelector('[data-file-name]'),I18n.ui("Nog geen bestand gekozen",'Nog geen bestand gekozen'),"textContent"); }
        };
    }

    dialog.querySelector('[data-cancel]').onclick = () => dialog.close();
    dialog.addEventListener('close', () => { dialog.remove(); editor.focus(); });
    dialog.querySelector('form').onsubmit = async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const submit = form.querySelector('[type=submit]');
        submit.disabled = true;
        try {
            let url = form.elements.url.value.trim();
            let html;
            if (isImage) {
                const file = form.elements.file.files[0];
                if (file) {
                    if (!['image/png','image/jpeg','image/gif','image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) throw Error(I18n.value(I18n.ui("Kies een PNG, JPG, GIF of WebP van maximaal 2 MB.",'Kies een PNG, JPG, GIF of WebP van maximaal 2 MB.')));
                    url = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(Error(I18n.value(I18n.ui("Afbeelding kon niet worden gelezen.",'Afbeelding kon niet worden gelezen.')))); reader.readAsDataURL(file); });
                } else if (!/^https?:$/.test(new URL(url).protocol)) throw Error(I18n.value(I18n.ui("Gebruik een webadres dat begint met https://.",'Gebruik een webadres dat begint met https://.')));
                const img = document.createElement('img'); img.src = url; img.alt = form.elements.description.value.trim();
                html = "<p>"+(img.outerHTML)+"</p><p><br></p>";
            } else {
                const id = youtubeId(url);
                if (!id) throw Error(I18n.value(I18n.ui("Plak een geldige YouTube-videolink.",'Plak een geldige YouTube-videolink.')));
                html = "<p><a href=\"https://www.youtube.com/watch?v="+(id)+"\"><span data-i18n=\"YouTube-video\">YouTube-video</span></a></p><p><br></p>";
            }
            if (!editor.isConnected) throw Error(I18n.value(I18n.ui("Het document is niet meer geopend.",'Het document is niet meer geopend.')));
            dialog.close(); editor.focus();
            selection.removeAllRanges();
            if (savedRange) selection.addRange(savedRange);
            else { const range = document.createRange(); range.selectNodeContents(editor); range.collapse(false); selection.addRange(range); }
            document.execCommand('insertHTML', false, html);
            wysiwygDirty = true; updateWysiwygModifiedState();
        } catch (error) { I18n.assign(form.querySelector('[role=alert]'),(error instanceof TypeError?I18n.ui("Vul een geldig webadres in of kies een bestand.",'Vul een geldig webadres in of kies een bestand.'):error.message),"textContent"); }
        finally { submit.disabled = false; }
    };
    dialog.showModal();
}
