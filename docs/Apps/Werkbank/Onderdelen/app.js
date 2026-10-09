
        const folderHandlesByPath = new Map();
        let allDirectoryPaths = [];
        let directoryHandles = []; // Array of folder handles
        let files = [];
        let fileContents = new Map(); // Cache file contents for search
        let activeFile = null;
        let activeFileIndex = null;
        let currentSearchQuery = '';
        let isEditMode = false;
        let currentRawContent = ''; // Raw content of the currently viewed file
        let originalRawContent = ''; // Original content before editing (for dirty detection)
        let wysiwygDirty = false; // Tracks unsaved changes in WYSIWYG editor
        let wysiwygFrontmatterRaw = ''; // Raw frontmatter string preserved during WYSIWYG editing

        // Virtual converter folder storage
        let converterFiles = new Map(); // Map of filename -> { content, name, relativePath }

        // Load converter files from localStorage on startup
        function loadConverterFiles() {
            try {
                const saved = GereedschapskistMode.storage.getItem('converterFiles');
                if (saved) {
                    const files = JSON.parse(saved);
                    converterFiles = new Map(files);
                }
            } catch (err) {
                console.error('Error loading converter files:', err);
            }
        }

        // Save converter files to localStorage
        function saveConverterFiles() {
            try {
                const files = Array.from(converterFiles.entries());
                GereedschapskistMode.storage.setItem('converterFiles', JSON.stringify(files));
            } catch (err) {
                console.error('Error saving converter files:', err);
            }
        }

        // Initialize converter files on page load
        loadConverterFiles();

        // Theme management
        function initTheme() {
            const savedTheme = GereedschapskistMode.storage.getItem('theme');
            const systemDark = savedTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', savedTheme === 'dark' || systemDark ? 'dark' : 'light');
        }

        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            GereedschapskistMode.storage.setItem('theme', newTheme);
        }

        // Initialize theme immediately
        initTheme();

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
                if (GereedschapskistMode.storage.getItem('theme') === 'system') {
                    if (e.matches) {
                        document.documentElement.setAttribute('data-theme', 'light');
                    } else {
                        document.documentElement.setAttribute('data-theme', 'dark');
                    }
                }
            });
        }

        // IndexedDB for storing directory handle
        const DB_NAME = GereedschapskistMode.key('MarkdownWerkbankLocalV2');
        const STORE_NAME = 'handles';

        async function openDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, 1);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME);
                    }
                };
            });
        }

        async function saveDirectoryHandles(handles) {
            try {
                const db = await openDB();
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.put(handles, 'directories');
                await new Promise((resolve, reject) => {
                    tx.oncomplete = resolve;
                    tx.onerror = () => reject(tx.error);
                });
                db.close();
            } catch (err) {
                console.error('Error saving directory handles:', err);
            }
        }

        async function getSavedDirectoryHandles() {
            try {
                const db = await openDB();
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const request = store.get('directories');
                const handles = await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
                db.close();
                return handles || [];
            } catch (err) {
                console.error('Error getting saved directory handles:', err);
                return [];
            }
        }

        async function clearIndexedDB() {
            if (!confirm(I18n.value(I18n.ui("Browserwerk wissen?\n\n• Losse documenten in deze browser worden verwijderd.\n• Alle gekoppelde mappen worden uit de lijst gehaald.\n• Het geopende document wordt gesloten; onbewaarde tekst gaat verloren.\n\nBestanden op je computer en eerder bewaarde werkmapkopieën blijven staan.\n\nKies Annuleer als je eerst Bewaar alles wilt gebruiken. Doorgaan met wissen?",'Browserwerk wissen?\n\n• Losse documenten in deze browser worden verwijderd.\n• Alle gekoppelde mappen worden uit de lijst gehaald.\n• Het geopende document wordt gesloten; onbewaarde tekst gaat verloren.\n\nBestanden op je computer en eerder bewaarde werkmapkopieën blijven staan.\n\nKies Annuleer als je eerst Bewaar alles wilt gebruiken. Doorgaan met wissen?')))) {
                return;
            }

            try {
                // Delete the IndexedDB database
                const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
                await new Promise((resolve, reject) => {
                    deleteRequest.onsuccess = () => resolve();
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                    deleteRequest.onblocked = () => {
                        console.warn(I18n.value(I18n.ui("Database deletion blocked",'Database deletion blocked')));
                        resolve();
                    };
                });

                // Clear directory handles
                directoryHandles = [];

                // Clear converter files
                converterFiles.clear();
                GereedschapskistMode.storage.removeItem('converterFiles');

                // Remove converter files from files array and fileContents
                files = files.filter(f => !f.isVirtual);
                for (const [path, content] of fileContents.entries()) {
                    if (path.startsWith('converter/')) {
                        fileContents.delete(path);
                    }
                }

                // Close the currently open document
                activeFile = null;
                activeFileIndex = null;isEditMode=false;wysiwygDirty=false;

                // Remove active state from file items
                document.querySelectorAll('.file-item.active, .tree-file.active').forEach(el => {
                    el.classList.remove('active');
                });

                // Restore welcome screen
                document.getElementById('content').innerHTML = "\n                    <div class=\"welcome\">\n                        <svg xmlns=\"http://www.w3.org/2000/svg\" viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\">\n                            <path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"></path>\n                            <polyline points=\"14 2 14 8 20 8\"></polyline>\n                            <line x1=\"16\" y1=\"13\" x2=\"8\" y2=\"13\"></line>\n                            <line x1=\"16\" y1=\"17\" x2=\"8\" y2=\"17\"></line>\n                            <polyline points=\"10 9 9 9 8 9\"></polyline>\n                        </svg>\n                        <span class=\"eyebrow\"><span data-i18n=\"JE EIGEN BESTANDEN, BINNEN HANDBEREIK\">JE EIGEN BESTANDEN, BINNEN HANDBEREIK</span></span><h2><span data-i18n=\"Je Markdown.\">Je Markdown.</span><br><span data-i18n=\"Je werkplek.\">Je werkplek.</span></h2><p><span data-i18n=\"Kies links een bestand om het hier te bekijken.\">Kies links een bestand om het hier te bekijken.</span></p>\n                    </div>\n                ";

                // Reload the file list
                await loadFiles();

                showNotification(I18n.value(I18n.ui("Mappen losgekoppeld en lokale conversies verwijderd",'Mappen losgekoppeld en lokale conversies verwijderd')), 'success');
            } catch (err) {
                console.error('Error clearing IndexedDB:', err);
                showNotification(I18n.value(I18n.ui("Leegmaken mislukt",'Leegmaken mislukt')), 'error');
            }
        }

        async function verifyPermission(handle, mode = 'read') {
            const options = { mode };
            // Check if permission is already granted
            if ((await handle.queryPermission(options)) === 'granted') {
                return true;
            }
            // Request permission
            if ((await handle.requestPermission(options)) === 'granted') {
                return true;
            }
            return false;
        }

        async function addFolder(selectAddedProject = false) {
            if (GereedschapskistMode.example) { GereedschapskistMode.go('own'); return; }
            try {
                await Werkmap.recall();
                if(Werkmap.active){
                    const access=await Werkmap.allAccess();
                    const writing=await access.root.getDirectoryHandle('Schrijven',{create:true});
                    if(!directoryHandles.some(h=>h.name==='Schrijven'))directoryHandles.push(writing);
                    await saveDirectoryHandles(directoryHandles);
                    selectedProject='Schrijven';await loadFiles({skipRestore:true});return;
                }
                const handle = await window.showDirectoryPicker({ mode: 'readwrite' });

                // Check if folder is already added
                const exists = directoryHandles.some(h => h.name === handle.name);
                if (exists) {
                    alert(I18n.value(I18n.ui("Er is al een map met deze naam geopend. Koppel die eerst los of kies een bovenliggende map.",'Er is al een map met deze naam geopend. Koppel die eerst los of kies een bovenliggende map.')));
                    return;
                }

                directoryHandles.push(handle);
                await saveDirectoryHandles(directoryHandles);
                await loadFiles();
                if (selectAddedProject) await switchProject(handle.name);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error opening folder:', err);
                    showNotification(I18n.value(I18n.ui("De map kon niet worden geopend. Probeer opnieuw in Chrome of Edge.",'De map kon niet worden geopend. Probeer opnieuw in Chrome of Edge.')), 'error');
                }
            }
        }

        function newDocumentFilename(filename, createdAt = new Date()) {
            const date = [createdAt.getFullYear(), String(createdAt.getMonth() + 1).padStart(2, '0'), String(createdAt.getDate()).padStart(2, '0')].join('-');
            return date + '-' + filename.trim().replace(/^\d{4}-\d{2}-\d{2}-/, '');
        }

        function requestNewFilename(folderPath = '', suggestedName = '') {
            const prefix = newDocumentFilename('');
            return new Promise(resolve => {
                const dialog = document.createElement('dialog');
                dialog.className = 'file-dialog';
                I18n.attribute(dialog,'aria-label',I18n.ui("Nieuw document",'Nieuw document'));
                dialog.innerHTML = "<form><h2><span data-i18n=\"Nieuw document\">Nieuw document</span></h2><label><span data-i18n=\"Bestandsnaam\">Bestandsnaam</span><input name=\"filename\" required autocomplete=\"off\" style=\"display:block;width:100%;padding:10px;margin:8px 0\"></label><p><span data-i18n=\"Typ een bestandsnaam. De extensie .md voegen we toe.\">Typ een bestandsnaam. De extensie .md voegen we toe.</span></p><div class=\"wp-actions\"><button type=\"button\"><span data-i18n=\"Annuleer\">Annuleer</span></button> <button class=\"action-primary\" type=\"submit\"><span data-i18n=\"Aanmaken\">Aanmaken</span></button></div></form>";
                const input = dialog.querySelector('input');
                input.value = suggestedName ? newDocumentFilename(suggestedName) : prefix;
                const finish = value => { dialog.close(); dialog.remove(); resolve(value); };
                dialog.querySelector('button[type="button"]').onclick = () => finish(null);
                dialog.addEventListener('cancel', event => { event.preventDefault(); finish(null); });
                dialog.querySelector('form').onsubmit = event => {
                    event.preventDefault();
                    if (!input.value.trim().replace(/\.md$/i, '').replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/^(?:VCU|HPAI|HP|WB|BOS|FMT)-/i, '').trim()) {
                        input.setCustomValidity(I18n.value(I18n.ui("Vul ook een titel in.",'Vul ook een titel in.'))); input.reportValidity(); return;
                    }
                    finish(input.value);
                };
                input.oninput = () => input.setCustomValidity('');
                document.body.append(dialog); dialog.showModal();
                input.focus(); input.setSelectionRange(prefix.length, input.value.replace(/\.md$/i, '').length);
            });
        }

        async function createNewFile(options = {}) {
            if (directoryHandles.length === 0) {
                return window.createLooseDocument(options);
            }

            let folderHandle = options.folderPath ? folderHandlesByPath.get(options.folderPath) : options.folderName
                ? directoryHandles.find(handle => handle.name === options.folderName)
                : directoryHandles[0];
            const pendingInbox=!folderHandle&&options.folderPath?.endsWith('/Inbox')?folderHandlesByPath.get(options.folderPath.slice(0,-6)):null;
            if(pendingInbox)folderHandle=pendingInbox;
            if (options.folderName && !folderHandle) {
                return { ok: false, error: `Folder is not open: ${options.folderName}` };
            }
            if (!options.folderPath && !options.folderName && directoryHandles.length > 1) {
                const choices = directoryHandles.map((handle, index) => `${index + 1}. ${handle.name}`).join('\n');
                const answer = prompt(I18n.value(I18n.ui("Kies een mapnummer:\n\n{0}",`Kies een mapnummer:\n\n${choices}`)), '1');
                if (answer === null) return { ok: false, error: 'Cancelled' };
                const folderIndex = Number.parseInt(answer, 10) - 1;
                if (!Number.isInteger(folderIndex) || !directoryHandles[folderIndex]) {
                    showNotification(I18n.value(I18n.ui("Dit mapnummer bestaat niet",'Dit mapnummer bestaat niet')), 'error');
                    return { ok: false, error: 'Folder number does not exist' };
                }
                folderHandle = directoryHandles[folderIndex];
            }

            if (!folderHandle) return { ok:false, error:'Open eerst de doelmap.' };
            // Ask for write access while the New File click still counts as user activation.
            // Waiting until after the filename prompt makes Chromium reject the request.
            let writePermission = await folderHandle.queryPermission({ mode: 'readwrite' });
            if (writePermission !== 'granted') {
                try {
                    writePermission = await folderHandle.requestPermission({ mode: 'readwrite' });
                } catch (err) {
                    console.warn(I18n.value(I18n.ui("Could not request write permission:",'Could not request write permission:')), err);
                }
            }
            if (writePermission !== 'granted') {
                showNotification(I18n.value(I18n.ui("Open de map opnieuw en geef toestemming om bestanden op te slaan",'Open de map opnieuw en geef toestemming om bestanden op te slaan')), 'error');
                return { ok: false, error: 'Re-open the folder and allow write access' };
            }

            const requestedName = options.filename || await requestNewFilename(options.folderPath || folderHandle.name, options.suggestedName);
            if (requestedName === null) return { ok: false, error: 'Cancelled' };

            let filename = requestedName.trim();
            if (!filename) {
                showNotification(I18n.value(I18n.ui("Vul een bestandsnaam in",'Vul een bestandsnaam in')), 'error');
                return { ok: false, error: 'File name is empty' };
            }
            if (filename.includes('/') || filename.includes('\\') || filename.includes('\0')) {
                showNotification(I18n.value(I18n.ui("Gebruik een bestandsnaam zonder schuine strepen",'Gebruik een bestandsnaam zonder schuine strepen')), 'error');
                return { ok: false, error: 'File name contains an invalid character' };
            }
            const documentTitle = filename.replace(/\.md$/i, '').replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/^(?:VCU|HPAI|HP|WB|BOS|FMT)-/i, '').replace(/[-_]+/g, ' ').trim();
            if (!options.filename) {
                filename = filename.replace(/\.md$/i, '').normalize('NFKC').toLowerCase()
                    .replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
                filename = filename.replace(/^(\d{4}-\d{2}-\d{2}-)?(vcu|hpai|hp|wb|bos|fmt)-/, (_, date, code) => (date || '') + code.toUpperCase() + '-');
                if (!/[\p{L}\p{N}]/u.test(filename)) {
                    showNotification(I18n.value(I18n.ui("Vul een titel met letters of cijfers in",'Vul een titel met letters of cijfers in')), 'error');
                    return { ok: false, error: 'File name is empty' };
                }
            }
            if (!filename.toLowerCase().endsWith('.md')) filename += '.md';
            filename = newDocumentFilename(filename);

            if(pendingInbox){try{folderHandle=await pendingInbox.getDirectoryHandle('Inbox',{create:true});folderHandlesByPath.set(options.folderPath,folderHandle);}catch(error){showNotification(I18n.value(I18n.ui("Inbox kon niet worden aangemaakt.",'Inbox kon niet worden aangemaakt.')),'error');return {ok:false,error:error.message};}}
            const existingNames = [];
            for await (const entry of folderHandle.values()) existingNames.push(entry.name.toLowerCase());
            if (existingNames.includes(filename.toLowerCase())) {
                showNotification(I18n.value(I18n.ui("Er bestaat al een bestand met deze naam",'Er bestaat al een bestand met deze naam')), 'error');
                return { ok: false, error: 'File already exists' };
            }

            try {
                const title = documentTitle;
                const initialContent = options.initialContent ? await options.initialContent(title) : `# ${title}\n\n`;
                const fileHandle = await folderHandle.getFileHandle(filename, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(initialContent);
                await writable.close();

                await loadFiles();
                const relativePath = `${options.folderPath || folderHandle.name}/${filename}`;
                const newIndex = files.findIndex(file => file.relativePath === relativePath);
                if (newIndex !== -1) {
                    await selectFile(newIndex);
                    if (!isEditMode) await toggleEditMode();
                    const editor = document.getElementById('wysiwygEditor');
                    if (editor) editor.focus();
                }
                showNotification(I18n.value(I18n.ui("Aangemaakt: {0}",`Aangemaakt: ${filename}`)), 'success');
                return { ok: true, filename, folderName: folderHandle.name };
            } catch (err) {
                console.error('Error creating file:', err);
                showNotification(I18n.value(I18n.ui("Aanmaken mislukt: {0}",`Aanmaken mislukt: ${err.message}`)), 'error');
                return { ok: false, error: err.message };
            }
        }

        async function removeFolder(index) {
            const handle=directoryHandles[index];if(!handle)return;
            const removesActive=activeFile?.folderName===handle.name;
            if(removesActive && wysiwygDirty && !confirm(I18n.value(I18n.ui("Je hebt niet-opgeslagen wijzigingen. Weggooien en map uit de lijst verwijderen?",'Je hebt niet-opgeslagen wijzigingen. Weggooien en map uit de lijst verwijderen?')))) return;
            const remaining=directoryHandles.filter((_,i)=>i!==index);
            await saveDirectoryHandles(remaining);
            directoryHandles=remaining;
            if(selectedProject===handle.name || selectedProject.startsWith(handle.name+'/')){selectedProject='all';GereedschapskistMode.storage.setItem('mw-project','all');}
            if(removesActive){activeFile=null;isEditMode=false;wysiwygDirty=false;currentRawContent=originalRawContent='';document.getElementById('content').classList.remove('editing');document.getElementById('content').innerHTML="<div class=\"welcome\"><h2><span data-i18n=\"Kies je document.\">Kies je document.</span></h2></div>";}
            await loadFiles();
            activeFileIndex=activeFile?files.findIndex(f=>f.relativePath===activeFile.relativePath):null;renderFileList();
            showNotification(I18n.value(I18n.ui("{0} is uit de lijst verwijderd. De map en bestanden blijven op je computer staan.",handle.name+' is uit de lijst verwijderd. De map en bestanden blijven op je computer staan.')),'success');
        }

        function showWritingAccessRequired(){
            const list=document.getElementById('fileList');list.replaceChildren();
            const message=document.createElement('p');message.textContent=I18n.t('Geef toegang om je schrijfmappen te openen.');message.style.cssText='font:14px/1.5 Arial;margin:0 0 12px;overflow-wrap:anywhere';
            const button=document.createElement('button');button.type='button';button.className='edit-btn';button.style.cssText='font:600 14px Arial;padding:10px 14px;border:1px solid #bbb;background:#fff;color:#222;cursor:pointer';button.textContent=I18n.t('Open schrijfmappen');
            button.onclick=async()=>{button.disabled=true;message.textContent=I18n.t('Toegang controleren…');try{await Werkmap.requestReadAccess();message.textContent=I18n.t('Schrijfmappen openen…');const access=await Werkmap.allAccess(false);const writing=await access.root.getDirectoryHandle('Schrijven');directoryHandles=[writing];selectedProject='Schrijven';activeFile=null;await loadFiles({skipRestore:true});for(const path of folderHandlesByPath.keys())if(path==='Schrijven'||path.startsWith('Schrijven/'))expandedFolders.add(path);renderFileList();}catch(error){message.textContent=error.message;message.setAttribute('role','alert');}finally{button.disabled=false;}};
            const choose=document.createElement('button');choose.type='button';choose.className='edit-btn';choose.textContent=I18n.t('Schrijven-map opnieuw koppelen');choose.style.cssText=button.style.cssText+';margin-top:10px';
            choose.onclick=async()=>{const selection=window.showDirectoryPicker({id:'writing-reconnect',mode:'read'});choose.disabled=true;try{const writing=await selection;if(writing.name!=='Schrijven')throw Error(I18n.t('Kies de map Schrijven binnen Mijn werk.'));directoryHandles=[writing];await saveDirectoryHandles(directoryHandles);selectedProject='Schrijven';activeFile=null;await loadFiles({skipRestore:true});for(const path of folderHandlesByPath.keys())expandedFolders.add(path);renderFileList();}catch(error){if(error.name!=='AbortError'){message.textContent=error.message;message.setAttribute('role','alert');}}finally{choose.disabled=false;}};
            list.append(message,button,choose);
        }
        async function restoreSavedFolders() {
            if (document.readyState === 'loading') await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
            await GereedschapskistMode.ready;
            if (GereedschapskistMode.redirecting) return;
            // The workmap's writing folder is the canonical starting point.
            if(window.Werkmap){
                await Werkmap.ready;
                try{
                    const access=await Werkmap.allAccess(false);
                    const writing=await access.root.getDirectoryHandle('Schrijven');
                    {const entries=writing.values();await entries.next();
                        directoryHandles=[writing];
                        selectedProject='Schrijven';
                        await loadFiles();
                        for(const path of folderHandlesByPath.keys())if(path==='Schrijven'||path.startsWith('Schrijven/'))expandedFolders.add(path);
                        renderFileList();return;
                    }
                }catch(error){if(Werkmap.active){const saved=await getSavedDirectoryHandles();const writing=saved.find(handle=>handle.name==='Schrijven');if(writing){try{await writing.values().next();directoryHandles=[writing];selectedProject='Schrijven';await loadFiles({skipRestore:true});for(const path of folderHandlesByPath.keys())expandedFolders.add(path);renderFileList();return;}catch{}}showWritingAccessRequired();const message=document.querySelector('#fileList p');if(message){message.textContent=error.message;message.setAttribute('role','alert');}return;}}
            }
            const savedHandles = await getSavedDirectoryHandles();
            if (savedHandles.length > 0) {
                const validHandles = [];
                for (const handle of savedHandles) {
                    try {
                        const hasPermission = await verifyPermission(handle);
                        if (hasPermission) {
                            validHandles.push(handle);
                        }
                    } catch (err) {
                        console.error('Error verifying permission for folder:', err);
                    }
                }

                if (validHandles.length > 0) {
                    directoryHandles = validHandles;
                    await saveDirectoryHandles(directoryHandles);
                    await loadFiles();
                } else if (converterFiles.size > 0) {
                    // No valid folders but we have converter files, load them
                    await loadFiles();
                }
            } else if (converterFiles.size > 0) {
                // No saved folders but we have converter files, load them
                await loadFiles();
            }
        }

        async function refreshFolders() {
            if(wysiwygDirty && !confirm(I18n.value(I18n.ui("Je hebt niet-opgeslagen wijzigingen. Weggooien en vernieuwen?",'Je hebt niet-opgeslagen wijzigingen. Weggooien en vernieuwen?')))) return;
            if (directoryHandles.length === 0) return;

            const refreshBtn = document.getElementById('refreshBtn');
            refreshBtn.classList.add('spinning');
            refreshBtn.disabled = true;

            try {
                // Verify permissions for all folders
                const validHandles = [];
                for (const handle of directoryHandles) {
                    try {
                        const hasPermission = await verifyPermission(handle);
                        if (hasPermission) {
                            validHandles.push(handle);
                        }
                    } catch (err) {
                        console.error('Error verifying permission:', err);
                    }
                }

                directoryHandles = validHandles;
                await saveDirectoryHandles(directoryHandles);

                if (directoryHandles.length > 0) {
                    const reopenPath=activeFile?.relativePath;
                    activeFile=null;isEditMode=false;wysiwygDirty=false;
                    await loadFiles();
                    const reopened=files.findIndex(f=>f.relativePath===reopenPath);if(reopened>=0)await selectFile(reopened);
                } else {
                    renderFolderList();
                    const fileList = document.getElementById('fileList');


                    // Check if there are converter files
                    if (converterFiles.size > 0) {
                        await loadFiles(); // This will handle converter files
                    } else {
                        fileList.innerHTML = "\n                            <div class=\"empty-state\">\n                                <span data-i18n=\"Koppel je mappen opnieuw.\">Koppel je mappen opnieuw.</span><br><span data-i18n=\"Kies ‘Open map’ en geef toegang.\">Kies ‘Open map’ en geef toegang.</span>\n                            </div>\n                        ";
                    }
                }
            } catch (err) {
                console.error('Error refreshing folders:', err);
            } finally {
                refreshBtn.classList.remove('spinning');
                refreshBtn.disabled = directoryHandles.length === 0;
            }
        }

        function renderFolderList() {
            const target = document.getElementById('newItemTarget');
            const previous = target.value;
            target.replaceChildren(...directoryHandles.map(handle => new Option(handle.name, handle.name)));
            if (directoryHandles.some(handle => handle.name === previous)) target.value = previous;
            document.getElementById('newItemTargetLabel').hidden = directoryHandles.length < 2;
            document.getElementById('newFolderBtn').disabled = directoryHandles.length === 0 && !window.Werkmap?.active;
            I18n.assign(document.getElementById('workspaceTitle'),(directoryHandles.length === 1?directoryHandles[0].name.toUpperCase():I18n.ui("MARKDOWN",'MARKDOWN')),"textContent");
            const folderListEl = document.getElementById('folderList');
            const newFileBtn = document.getElementById('newFileBtn');
            if (newFileBtn) newFileBtn.disabled = false;
            for (const button of document.querySelectorAll('[data-template]')) button.disabled = false;

            if (directoryHandles.length === 0) {
                folderListEl.innerHTML = '';
                folderListEl.style.display = 'none';
                return;
            }

            folderListEl.style.display = 'block';
            folderListEl.innerHTML = directoryHandles.map((handle, index) => "\n                <div class=\"folder-tag\">\n                    <span class=\"folder-tag-name\">"+(escapeHtml(handle.name))+"</span>\n                    <button class=\"folder-tag-remove\" onclick=\"removeFolder("+(index)+")\" title=\"Uit lijst verwijderen; bestanden blijven staan\" aria-label=\""+(escapeHtml(handle.name))+" uit lijst verwijderen\" data-i18n-title=\"Uit lijst verwijderen; bestanden blijven staan\" data-i18n-aria-label=\"{2} uit lijst verwijderen\"><span data-i18n=\"Map uit lijst halen\">Map uit lijst halen</span></button>\n                </div>\n            ").join('');
        }

        let fileLoadQueue = Promise.resolve();
        function loadFiles(options = {}) {
            const next = fileLoadQueue.then(() => loadFilesOnce(options));
            fileLoadQueue = next.catch(() => {});
            return next;
        }

        async function loadFilesOnce(options = {}) {
            await window.consolidateMijnTeam?.();
            allDirectoryPaths = [];
            folderHandlesByPath.clear();
            files = [];
            fileContents.clear();
            expandedFolders.clear();
            activeFileIndex = null;
            const fileList = document.getElementById('fileList');

            const loader = document.getElementById('loader');
            const loaderCount = document.getElementById('loaderCount');
            const refreshBtn = document.getElementById('refreshBtn');

            // Render folder list
            renderFolderList();

            // Enable refresh button if we have folders
            refreshBtn.disabled = directoryHandles.length === 0;

            // Add virtual converter files even if no folders selected
            for (const [filename, fileData] of converterFiles.entries()) {
                const virtualFile = {
                    relativePath: `converter/${filename}`,
                    folderName: 'converter',
                    name: filename,
                    isVirtual: true,
                    getFile: async () => {
                        return new File([fileData.content], filename, { type: 'text/markdown' });
                    }
                };
                files.push(virtualFile);
            }

            if (directoryHandles.length === 0 && converterFiles.size === 0) {
                fileList.innerHTML = "<div class=\"empty-state\"><span data-i18n=\"Nog geen map geopend.\">Nog geen map geopend.</span><br><span data-i18n=\"Kies Beheer → Open map om je bestanden te bekijken.\">Kies Beheer → Open map om je bestanden te bekijken.</span></div>";
                return;
            }

            if (directoryHandles.length === 0 && converterFiles.size > 0) {
                // Only converter files, no need for loader
                loader.classList.remove('visible');
                fileList.style.display = 'block';
                files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
                renderFileList();
                await loadAllFileContents(options);
                return;
            }

            // Show loader and hide file list
            loader.classList.add('visible');
            fileList.style.display = 'none';
            loaderCount.textContent = '';

            // Recursively scan directory for markdown files
            async function scanDirectory(dirHandle, baseName, path = '', ignoreRules = []) {
                allDirectoryPaths.push(path ? `${baseName}/${path}` : baseName);
                folderHandlesByPath.set(path ? `${baseName}/${path}` : baseName, dirHandle);
                for await (const entry of dirHandle.values()) {
                    if (entry.name.startsWith('.') || entry.name==='node_modules' || entry.name==='Herstelkopieen') continue;
                    const entryPath = path ? `${path}/${entry.name}` : entry.name;
                    if (pathIsIgnored(entryPath, entry.kind === 'directory', ignoreRules)) continue;
                    if (entry.kind === 'file' && /\.(md|markdown|txt)$/i.test(entry.name)) {
                        // Store both the handle and the relative path (prefixed with folder name)
                        const fullPath = path ? `${baseName}/${path}/${entry.name}` : `${baseName}/${entry.name}`;
                        entry.relativePath = fullPath;
                        entry.folderName = baseName;
                        files.push(entry);
                        // Update loader count
                        I18n.assign(loaderCount,I18n.ui("{0} bestanden gevonden…",`${projectFiles().length} bestanden gevonden…`),"textContent");
                    } else if (entry.kind === 'directory') {
                        // Recursively scan subdirectories
                        const subPath = path ? `${path}/${entry.name}` : entry.name;
                        await scanDirectory(entry, baseName, subPath, ignoreRules);
                    }
                }
            }

            // Scan all folders
            for (const handle of directoryHandles) {
                expandedFolders.add(handle.name);
                await scanDirectory(handle, handle.name, '', await loadIgnoreRules(handle));
            }

            // Hide loader and show file list
            loader.classList.remove('visible');
            fileList.style.display = 'block';

            // Sort alphabetically by relative path
            files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

            if (files.length === 0) {
                // Check if we have converter files that should be shown
                if (converterFiles.size > 0) {
                    // Converter files should have been added earlier, but if not, add them now
                    for (const [filename, fileData] of converterFiles.entries()) {
                        const virtualFile = {
                            relativePath: `converter/${filename}`,
                            folderName: 'converter',
                            name: filename,
                            isVirtual: true,
                            getFile: async () => {
                                return new File([fileData.content], filename, { type: 'text/markdown' });
                            }
                        };
                        files.push(virtualFile);
                    }
                    files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
                    renderFileList();
                    await loadAllFileContents(options);
                    return;
                } else {
                    renderFileList();
                    return;
                }
            }

            // Render file list
            renderFileList();

            // Pre-load file contents for search
            await loadAllFileContents(options);
        }

        async function loadAllFileContents(options = {}) {
            for (const file of files) {
                try {
                    let text;
                    if (file.isVirtual) {
                        // Virtual file - get content directly
                        const fileData = converterFiles.get(file.name);
                        text = fileData ? fileData.content : '';
                    } else {
                        const fileData = await file.getFile();
                        text = await fileData.text();
                    }
                    fileContents.set(file.relativePath, text);
                } catch (err) {
                    console.error(`Error loading ${file.relativePath}:`, err);
                }
            }
            try { for (const path of JSON.parse(GereedschapskistMode.storage.getItem('mw-folders-'+selectedProject)||'[]')) expandedFolders.add(path); } catch {}
            renderFileList();
            if(!activeFile && !options.skipRestore) await restoreLastOpenFile();
        }

        function initialDocumentPath(paths, saved, roots) {
            if (saved && paths.includes(saved)) return saved;
            for (const root of roots) {
                const match = paths.find(path => path.slice(0, path.lastIndexOf('/')) === root && /^(?:00\s*-\s*)?begin hier\.md$/i.test(path.split('/').pop()));
                if (match) return match;
            }
            return null;
        }

        function restoreLastOpenFile() {
            if (activeFile || writingFolderOverview()) return;
            try {
                const savedPath = GereedschapskistMode.storage.getItem('mw-document-'+selectedProject);
                const lastPath = initialDocumentPath(files.filter(f=>projectIncludes(f.relativePath)).map(f=>f.relativePath), savedPath, selectedProject==='all'?directoryHandles.map(h=>h.name):[selectedProject]);
                if (!lastPath) return;
                const idx = files.findIndex(f => f.relativePath === lastPath && projectIncludes(f.relativePath));
                if (idx !== -1) {
                    // Expand parent folders so the file is visible in the tree
                    const parts = projectTreePath(lastPath).split('/');
                    let folderPath = '';
                    for (let i = 0; i < parts.length - 1; i++) {
                        folderPath = folderPath ? folderPath + '/' + parts[i] : parts[i];
                        expandedFolders.add(folderPath);
                    }
                    renderFileList();
                    selectFile(idx);
                }
            } catch (e) {}
        }

        // Track expanded folders
        let expandedFolders = new Set();

        function buildFileTree(filesList) {
            const tree = { folders: Object.create(null), files: [] };

            for (let i = 0; i < filesList.length; i++) {
                const file = filesList[i];
                const parts = projectTreePath(file.relativePath).split('/');

                if (parts.length === 1) {
                    // Root level file
                    tree.files.push({ file, index: files.indexOf(file) });
                } else {
                    // Nested file
                    let current = tree;
                    for (let j = 0; j < parts.length - 1; j++) {
                        const folderName = parts[j];
                        if (!current.folders[folderName]) {
                            current.folders[folderName] = { folders: Object.create(null), files: [] };
                        }
                        current = current.folders[folderName];
                    }
                    current.files.push({ file, index: files.indexOf(file) });
                }
            }

            for (const originalPath of allDirectoryPaths.filter(projectIncludes)) {
                const path = projectTreePath(originalPath);
                let current = tree;
                for (const part of path.split('/')) {
                    if (!current.folders[part]) current.folders[part] = { folders: Object.create(null), files: [] };
                    current = current.folders[part];
                }
            }
            return tree;
        }


        function documentListTitle(file) {
            const content = fileContents.get(file.relativePath) || '';
            let fence = '', previous = '';
            for (const line of content.split(/\r?\n/)) {
                const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
                if (marker) { if (!fence) fence = marker[1][0]; else if (marker[1][0] === fence) fence = ''; previous = ''; continue; }
                if (fence) continue;
                const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
                if (heading?.[1].trim()) return heading[1].trim();
                if (previous && /^\s{0,3}(?:=+|-+)\s*$/.test(line)) return previous;
                previous = line.trim();
            }
            return file.name;
        }

        function renderTree(tree, path = '') {
            let html = '';

            // Sort and render folders first
            const folderNames = Object.keys(tree.folders).sort(compareWritingFolders);
            for (const folderName of folderNames) {
                const folderPath = path ? `${path}/${folderName}` : folderName;
                const isExpanded = expandedFolders.has(folderPath);
                const folder = tree.folders[folderName];

                html += "\n                    <div class=\"tree-folder\">\n                        <div class=\"tree-folder-row\"><div class=\"tree-folder-header "+(isExpanded ? 'expanded' : '')+"\" role=\"button\" tabindex=\"0\" aria-expanded=\""+(isExpanded)+"\" data-folder-path=\""+(escapeHtml(folderPath))+"\" onclick=\"toggleFolder(this.dataset.folderPath)\">\n                            <svg class=\"chevron\" xmlns=\"http://www.w3.org/2000/svg\" viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n                                <polyline points=\"9 18 15 12 9 6\"></polyline>\n                            </svg>\n                            <svg class=\"folder-icon\" xmlns=\"http://www.w3.org/2000/svg\" viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n                                <path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z\"></path>\n                            </svg>\n                            <span>"+(escapeHtml(folderPath === "converter" ? I18n.t("Losse documenten") : folderName))+"</span>\n                        </div>\n                        </div>\n                        <div class=\"tree-folder-contents "+(isExpanded ? 'expanded' : '')+"\" data-path=\""+(escapeHtml(folderPath))+"\">\n                            "+(renderTree(folder, folderPath))+"\n                        </div>\n                    </div>\n                ";
            }

            // Then render files
            for (const { file, index } of tree.files) {
                const activeClass = index === activeFileIndex ? 'active' : '';
                const fileName = documentListTitle(file);

                html += "\n                    <div role=\"button\" tabindex=\"0\" class=\"tree-file "+(activeClass)+"\" data-index=\""+(index)+"\" onclick=\"selectFile("+(index)+")\">\n                        <svg xmlns=\"http://www.w3.org/2000/svg\" viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n                            <path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"></path>\n                            <polyline points=\"14 2 14 8 20 8\"></polyline>\n                        </svg>\n                        <span class=\"file-name\">"+(escapeHtml(fileName))+"</span>\n                    </div>\n                ";
            }

            return html;
        }

        function toggleFolder(path) {
            if (expandedFolders.has(path)) {
                expandedFolders.delete(path);
            } else {
                expandedFolders.add(path);
            }

            const isExpanded = expandedFolders.has(path);
            const header = Array.from(document.querySelectorAll('.tree-folder-header[data-folder-path]'))
                .find(element => element.dataset.folderPath === path);
            if (header) {
                header.classList.toggle('expanded', isExpanded);
                header.setAttribute('aria-expanded', String(isExpanded));
                header.closest('.tree-folder-row')?.nextElementSibling?.classList.toggle('expanded', isExpanded);
            }
        }

        function renderFileList(searchResults = null) {
            const sharedSearch = document.getElementById('suite-search');
            if (sharedSearch && searchResults === null) {
                const previousQuery = currentSearchQuery;
                currentSearchQuery = sharedSearch.value.trim();
                if (previousQuery !== currentSearchQuery && activeFile && !isEditMode) {
                    const scrollTop = document.scrollingElement?.scrollTop;
                    renderFileView(currentRawContent);
                    if (scrollTop !== undefined) document.scrollingElement.scrollTop = scrollTop;
                }
                if (currentSearchQuery) {
                    const query = currentSearchQuery.toLocaleLowerCase('nl');
                    const namesOnly = document.getElementById('writing-search-scope')?.value === 'names';
                    searchResults = projectFiles().filter(file =>
                        file.relativePath.toLocaleLowerCase('nl').includes(query) ||
                        documentListTitle(file).toLocaleLowerCase('nl').includes(query) ||
                        (!namesOnly && (fileContents.get(file.relativePath) || '').toLocaleLowerCase('nl').includes(query))
                    ).map(file => ({file, matchPreview:null}));
                }
            }
            updateProjectControls();
            if(selectedProject !== 'all') expandedFolders.add(selectedProject);
            const fileList = document.getElementById('fileList');


            if (searchResults !== null) {
                // Flat list for search results
                if (searchResults.length === 0) {
                    fileList.innerHTML = "<div class=\"empty-state\"><span data-i18n=\"Geen resultaten gevonden.\">Geen resultaten gevonden.</span></div>";
                    return;
                }

                fileList.innerHTML = searchResults.map(result => {
                    const index = files.findIndex(f => f.relativePath === result.file.relativePath);
                    const activeClass = index === activeFileIndex ? 'active' : '';

                    if (result.matchPreview) {
                        return "\n                            <div class=\"file-item has-match "+(activeClass)+"\" data-index=\""+(index)+"\" onclick=\"selectFile("+(index)+")\">\n                                <div class=\"file-name-row\">\n                                    <svg xmlns=\"http://www.w3.org/2000/svg\" viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n                                        <path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"></path>\n                                        <polyline points=\"14 2 14 8 20 8\"></polyline>\n                                    </svg>\n                                    "+(highlightText(documentListTitle(result.file), currentSearchQuery))+"\n                                </div>\n                                <span class=\"match-preview\">"+(result.matchPreview)+"</span>\n                            </div>\n                        ";
                    }

                    return "\n                        <div class=\"file-item "+(activeClass)+"\" data-index=\""+(index)+"\" onclick=\"selectFile("+(index)+")\">\n                            <svg xmlns=\"http://www.w3.org/2000/svg\" viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n                                <path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"></path>\n                                <polyline points=\"14 2 14 8 20 8\"></polyline>\n                            </svg>\n                            "+(highlightText(documentListTitle(result.file), currentSearchQuery))+"\n                        </div>\n                    ";
                }).join('');
            } else {
                // Tree view for normal browsing
                const tree = buildFileTree(projectFiles());
                fileList.innerHTML = "<div class=\"folder-tree\">"+(renderTree(tree))+"</div>";
                if(!projectFiles().length && !allDirectoryPaths.some(projectIncludes)) fileList.innerHTML="<div class=\"empty-state\"><span data-i18n=\"Open een eigen werkmap.\">Open een eigen werkmap.</span></div>";
            }
        }

        function highlightText(text, query) {
            if (!query) return escapeHtml(text);
            const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
            return escapeHtml(text).replace(regex, "<mark>$1</mark>");
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        function escapeRegex(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function parseFrontmatter(content) {
            const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
            const match = content.match(frontmatterRegex);

            if (!match) {
                return { frontmatter: null, content: content };
            }

            const frontmatterText = match[1];
            const bodyContent = content.slice(match[0].length);
            const frontmatter = {};

            // Parse YAML-like frontmatter
            const lines = frontmatterText.split('\n');
            let currentKey = null;
            let currentValue = [];

            for (const line of lines) {
                // Check if it's a new key
                const keyMatch = line.match(/^([a-zA-Z_-]+)\s*:\s*(.*)$/);

                if (keyMatch) {
                    // Save previous key if exists
                    if (currentKey) {
                        frontmatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
                    }

                    currentKey = keyMatch[1];
                    const value = keyMatch[2].trim();

                    // Check for inline array [item1, item2]
                    if (value.startsWith('[') && value.endsWith(']')) {
                        currentValue = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
                    } else if (value) {
                        currentValue = [value.replace(/^["']|["']$/g, '')];
                    } else {
                        currentValue = [];
                    }
                } else if (line.match(/^\s+-\s+(.+)$/)) {
                    // Array item
                    const itemMatch = line.match(/^\s+-\s+(.+)$/);
                    currentValue.push(itemMatch[1].trim().replace(/^["']|["']$/g, ''));
                } else if (line.trim() && currentKey) {
                    // Continuation of previous value
                    currentValue.push(line.trim());
                }
            }

            // Save last key
            if (currentKey) {
                frontmatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
            }

            return { frontmatter, content: bodyContent };
        }

        function renderFrontmatter(frontmatter, inline = false) {
            if (!frontmatter || !Object.keys(frontmatter).length) return '';
            const rows = Object.entries(frontmatter).map(([key, value]) => {
                const items = Array.isArray(value) ? value : [value];
                const displayValue = items.map(item => {
                    const text = String(item ?? '');
                    if (/^https?:\/\/\S+$/i.test(text)) {
                        return "<a href=\""+(escapeHtml(text))+"\" target=\"_blank\" rel=\"noopener noreferrer\">"+(escapeHtml(text))+"</a>";
                    }
                    return Array.isArray(value) ? "<span class=\"frontmatter-tag\">"+(escapeHtml(text))+"</span>" : escapeHtml(text);
                }).join('');
                return "<div class=\"frontmatter-row\"><span class=\"frontmatter-key\">"+(escapeHtml(key))+"</span><span class=\"frontmatter-value\">"+(displayValue)+"</span></div>";
            }).join('');
            if (inline) return "<div class=\"frontmatter\">" + rows + "</div>";
            return "<details class=\"frontmatter-details\"><summary class=\"frontmatter-summary\"><span data-i18n=\"Documentgegevens\">Documentgegevens</span></summary><div class=\"frontmatter\">"+(rows)+"</div></details>";
        }



        async function selectFile(index) {
            const file = files[index];
            if (!file) return;

            // If in edit mode with unsaved changes, confirm before switching
            if (isEditMode) {
                if (wysiwygDirty) {
                    if (!confirm(I18n.value(I18n.ui("Je hebt wijzigingen die niet zijn opgeslagen. Wil je die weggooien?",'Je hebt wijzigingen die niet zijn opgeslagen. Wil je die weggooien?')))) {
                        return;
                    }
                }
                wysiwygDirty = false;
                isEditMode = false;
                document.getElementById('content').classList.remove('editing');
            }

            activeFileIndex = index;

            // Update active state for both flat list and tree view
            document.querySelectorAll('.file-item, .tree-file').forEach((el) => {
                const elIndex = parseInt(el.dataset.index);
                el.classList.toggle('active', elIndex === index);
            });

            activeFile = file;

            // Remember the open file for session restore
            try {
                GereedschapskistMode.storage.setItem('lastOpenFile', file.relativePath);
                GereedschapskistMode.storage.setItem('mw-document-'+selectedProject, file.relativePath);
            } catch (e) {}

            try {
                let rawContent;
                if (file.isVirtual) {
                    const fileData = converterFiles.get(file.name);
                    rawContent = fileData ? fileData.content : '';
                } else {
                    rawContent = await (await file.getFile()).text();
                    fileContents.set(file.relativePath, rawContent);
                }

                // Store raw content for editing
                currentRawContent = rawContent;
                originalRawContent = rawContent;

                Werkstatus.document(file.relativePath,rawContent);
                renderFileView(rawContent);
            } catch (err) {
                console.error('Lezen mislukt:', err);
                document.getElementById('content').innerHTML = "\n                    <div class=\"welcome\">\n                        <p><span data-i18n=\"Lezen mislukt:\">Lezen mislukt:</span> "+(err.message)+"</p>\n                    </div>\n                ";
            }

            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        }

        // --- Wiki-link / Bi-directional link support ---

        function resolveWikiLink(linkText) { return resolveInternalDocument(linkText, files); }

        function processWikiLinks(html) {
            const root = document.createElement('div');
            root.innerHTML = html;
            renderInternalLinks(root);
            return root.innerHTML;
        }

        function getBacklinks(currentFile) {
            if (!currentFile) return [];
            const backlinks = [];
            const currentName = currentFile.name.replace(/\.[^.]+$/, '').toLowerCase();
            const currentRel = currentFile.relativePath.replace(/\.[^.]+$/, '').toLowerCase();

            for (const [path, content] of fileContents) {
                if (path === currentFile.relativePath) continue;
                // Find all [[...]] references in this file's raw content
                const wikiRe = /\[\[([^\]|]+?)(?:\|[^\]]+?)?\]\]/g;
                let m;
                while ((m = wikiRe.exec(content)) !== null) {
                    const target = m[1].trim().toLowerCase();
                    if (resolveWikiLink(m[1]) === currentFile) {
                        // Find context around the match
                        const start = Math.max(0, m.index - 40);
                        const end = Math.min(content.length, m.index + m[0].length + 40);
                        let preview = content.slice(start, end).replace(/\n/g, ' ').trim();
                        if (start > 0) preview = '...' + preview;
                        if (end < content.length) preview = preview + '...';

                        const file = files.find(f => f.relativePath === path);
                        if (file) {
                            backlinks.push({ file, path, preview });
                        }
                        break; // one entry per file
                    }
                }
            }
            return backlinks;
        }

        function renderBacklinks(backlinks) {
            if (backlinks.length === 0) {
                return "\n                    <div class=\"backlinks-section\">\n                        <div class=\"backlinks-header\">\n                            <svg xmlns=\"http://www.w3.org/2000/svg\" viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n                                <path d=\"M9 17H7A5 5 0 0 1 7 7h2\"></path>\n                                <path d=\"M15 7h2a5 5 0 0 1 0 10h-2\"></path>\n                                <line x1=\"8\" y1=\"12\" x2=\"16\" y2=\"12\"></line>\n                            </svg>\n                            <span data-i18n=\"Verwijzingen hierheen\">Verwijzingen hierheen</span>\n                            <span class=\"backlinks-count\">0</span>\n                        </div>\n                        <div class=\"backlinks-empty\"><span data-i18n=\"Nog geen andere bestanden verwijzen naar deze pagina.\">Nog geen andere bestanden verwijzen naar deze pagina.</span></div>\n                    </div>\n                ";
            }

            const items = backlinks.map(bl => {
                const idx = files.indexOf(bl.file);
                return "\n                    <div class=\"backlink-item\" onclick=\"selectFile("+(idx)+")\">\n                        <svg xmlns=\"http://www.w3.org/2000/svg\" viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n                            <path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"></path>\n                            <polyline points=\"14 2 14 8 20 8\"></polyline>\n                        </svg>\n                        <div class=\"backlink-info\">\n                            <span class=\"backlink-name\">"+(escapeHtml(bl.file.name.replace(/\.[^.]+$/, '')))+"</span>\n                            <span class=\"backlink-preview\">"+(escapeHtml(bl.preview))+"</span>\n                        </div>\n                    </div>\n                ";
            }).join('');

            return "\n                <div class=\"backlinks-section\">\n                    <div class=\"backlinks-header\">\n                        <svg xmlns=\"http://www.w3.org/2000/svg\" viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n                            <path d=\"M9 17H7A5 5 0 0 1 7 7h2\"></path>\n                            <path d=\"M15 7h2a5 5 0 0 1 0 10h-2\"></path>\n                            <line x1=\"8\" y1=\"12\" x2=\"16\" y2=\"12\"></line>\n                        </svg>\n                        <span data-i18n=\"Verwijzingen hierheen\">Verwijzingen hierheen</span>\n                        <span class=\"backlinks-count\">"+(backlinks.length)+"</span>\n                    </div>\n                    <div class=\"backlinks-list\">\n                        "+(items)+"\n                    </div>\n                </div>\n            ";
        }

        function persistVirtualFiles(next) {
            GereedschapskistMode.storage.setItem('converterFiles', JSON.stringify([...next]));
            converterFiles = next;
        }

        function deleteVirtualFile(file) {
            if (!file.isVirtual || !converterFiles.has(file.name)) return { ok: false, error: 'Dit document is niet meer beschikbaar. Vernieuw de lijst.' };
            try { const next = new Map(converterFiles); next.delete(file.name); persistVirtualFiles(next); return { ok: true }; }
            catch (error) { return { ok: false, error: `Browserkopie niet verwijderd: ${error.message}` }; }
        }

        function openDeleteFileDialog() {
            const file = activeFile;
            if (!file) return;
            const sourcePath = file.relativePath.slice(0, file.relativePath.lastIndexOf('/'));
            const dialog = document.createElement('dialog');
            dialog.className = 'file-dialog';
            dialog.innerHTML = "<form><h2><span data-i18n=\"Bestand verwijderen?\">Bestand verwijderen?</span></h2><p class=\"delete-name\" style=\"overflow-wrap:anywhere\"></p>\n                <p><span data-i18n=\"De huidige tekst blijft als kopie in de prullenbak bewaard.\">De huidige tekst blijft als kopie in de prullenbak bewaard.</span></p><p>"+(file.isVirtual ? I18n.t('Dit verplaatst de browserkopie naar de prullenbak van Werkplaats. Bewaar alles daarna opnieuw om de wijziging in je werkmap vast te leggen.') : I18n.t('Het bestand verdwijnt uit de lokale map. Een tekstkopie blijft in de prullenbak van Werkplaats om het op deze plek terug te zetten.'))+"</p>\n                <p role=\"alert\"></p><div class=\"wp-actions\"><button type=\"button\" autofocus><span data-i18n=\"Annuleer\">Annuleer</span></button> <button type=\"submit\"><span data-i18n=\"Naar prullenbak\">Naar prullenbak</span></button></div></form>";
            dialog.querySelector('.delete-name').textContent = file.relativePath;
            let busy = false;
            dialog.oncancel = event => { if (busy) event.preventDefault(); };
            dialog.querySelector('[type="button"]').onclick = () => { if (!busy) dialog.close(); };
            dialog.onclose = () => dialog.remove();
            dialog.querySelector('form').onsubmit = async event => {
                event.preventDefault();
                if (busy) return;
                busy = true;
                const submit = dialog.querySelector('[type="submit"]');
                submit.disabled = true;
                let result;
                try {
                    const savedContent=file.isVirtual?converterFiles.get(file.name)?.content:await (await file.getFile()).text();
                    const content=isEditMode&&document.getElementById('wysiwygEditor')?getWysiwygMarkdown():savedContent;
                    result=await Prullenbak.remove('Werkbank',{name:file.name,path:file.relativePath,content,savedContent},()=>file.isVirtual?deleteVirtualFile(file):deleteMarkdownFile(file,folderHandlesByPath.get(sourcePath)),{external:!file.isVirtual});
                } catch(error) {result={ok:false,error:error.message};}
                if (!result.ok) {
                    dialog.querySelector('[role="alert"]').textContent = result.error;
                    busy = false; submit.disabled = false;
                    return;
                }
                dialog.close();
                activeFile = null; activeFileIndex = null;
                currentRawContent = ''; originalRawContent = '';
                isEditMode = false; wysiwygDirty = false;
                fileContents.delete(file.relativePath);
                files = files.filter(entry => entry.relativePath !== file.relativePath);
                try { GereedschapskistMode.storage.removeItem('lastOpenFile'); GereedschapskistMode.storage.removeItem('mw-document-'+selectedProject); } catch (_) {}
                if (documentFocused) toggleDocumentFocus();
                const content = document.getElementById('content');
                content.classList.remove('editing');
                content.innerHTML = "<div class=\"empty-state\"><p><span data-i18n=\"Bestand verwijderd. Kies een ander bestand uit de lijst.\">Bestand verwijderd. Kies een ander bestand uit de lijst.</span></p></div>";
                renderFileList();
                try {
                    await loadFiles({skipRestore:true});
                    updateDocumentOutline();
                    const message = `Verwijderd: ${file.relativePath}${file.isVirtual ? '. Gebruik Bewaar alles om je werkmap bij te werken.' : ''}`;
                    const status = document.getElementById('wm-message');
                    if (status) {
                        status.textContent = message;
                        const notice = status.firstChild;
                        setTimeout(() => {
                            if (status.textContent === message && status.firstChild === notice) status.textContent = '';
                        }, 6000);
                    }
                    showNotification(message, 'success');
                } catch (_) { showNotification(I18n.value(I18n.ui("Bestand verwijderd. Vernieuw de folder om het overzicht bij te werken.",'Bestand verwijderd. Vernieuw de folder om het overzicht bij te werken.')), 'error'); }
            };
            document.body.append(dialog); dialog.showModal();
        }

        window.PrullenbakDocumenten={async restore(item){
            if(wysiwygDirty)throw Error(I18n.value(I18n.ui("Bewaar eerst je huidige document voordat je een bestand terugzet.",'Bewaar eerst je huidige document voordat je een bestand terugzet.')));
            await loadFiles();
            const path=item.path.slice(0,item.path.lastIndexOf('/')),directory=folderHandlesByPath.get(path);
            if(!directory)throw Error(I18n.value(I18n.ui("Open eerst de oorspronkelijke computermap in Schrijven: {0}",'Open eerst de oorspronkelijke computermap in Schrijven: '+path)));
            if(await directory.requestPermission({mode:'readwrite'})!=='granted')throw Error(I18n.value(I18n.ui("Geef schrijftoegang tot de oorspronkelijke map.",'Geef schrijftoegang tot de oorspronkelijke map.')));
            try{await directory.getFileHandle(item.name);throw Error(I18n.value(I18n.ui("Er staat al een bestand met deze naam. Er wordt niets overschreven.",'Er staat al een bestand met deze naam. Er wordt niets overschreven.')));}
            catch(error){if(error.name!=='NotFoundError')throw error;}
            const handle=await directory.getFileHandle(item.name,{create:true}),writer=await handle.createWritable();await writer.write(item.content);await writer.close();await loadFiles();
        }};

        async function deleteMarkdownFile(file, source) {
            if (!file || file.isVirtual || !/\.md$/i.test(file.name) || !source) return { ok: false, error: 'Selecteer een lokaal Markdown-bestand.' };
            try {
                const permission = await source.requestPermission({ mode: 'readwrite' });
                if (permission !== 'granted') return { ok: false, error: 'Geef schrijftoegang tot deze map om het bestand te verwijderen.' };
                const current = await source.getFileHandle(file.name);
                if (!await current.isSameEntry(file)) return { ok: false, error: 'Het bestand is intussen vervangen. Vernieuw de folder en probeer opnieuw.' };
                await source.removeEntry(file.name);
                return { ok: true };
            } catch (error) {
                return { ok: false, error: `Verwijder is niet gelukt. ${error.message}` };
            }
        }

        async function moveVirtualFile(file, targetPath) {
            const target = folderHandlesByPath.get(targetPath);
            const source = converterFiles.get(file.name);
            if (!file.isVirtual || !target || !source) return { ok: false, error: 'Open eerst de doelmap en probeer opnieuw.' };
            if (GereedschapskistMode.example) return { ok: false, error: 'Voorbeelddocumenten blijven apart. Ga naar je eigen werk om een document naar een map te verplaatsen.' };
            let created = false;
            try {
                if (await target.requestPermission({ mode: 'readwrite' }) !== 'granted') return { ok: false, error: 'Geef schrijftoegang tot de doelmap.' };
                for await (const entry of target.values()) if (entry.name.toLowerCase() === file.name.toLowerCase()) return { ok: false, error: 'Er bestaat al een bestand of map met deze naam op de bestemming.' };
                const body = isEditMode && document.getElementById('wysiwygEditor') ? getWysiwygMarkdown() : source.content;
                const destination = await target.getFileHandle(file.name, { create: true });
                if ((await destination.getFile()).size > 0) return { ok: false, error: 'Er bestaat ondertussen al een bestand met deze naam. Kies een andere doelmap.' };
                created = true;
                const writer = await destination.createWritable();
                try { await writer.write(body); await writer.close(); }
                catch (error) { try { await writer.abort(); } catch (_) {} throw error; }
                if (await (await destination.getFile()).text() !== body) throw new Error(I18n.value(I18n.ui("De kopie kon niet worden gecontroleerd.",'De kopie kon niet worden gecontroleerd.')));
                const next = new Map(converterFiles);
                next.delete(file.name);
                try { persistVirtualFiles(next); await window.ProjectMaterials?.relocate(file.relativePath, `${targetPath}/${file.name}`, file.name); }
                catch (error) { return { ok: false, error: `De kopie staat in ${targetPath}, maar de browserkopie is behouden: ${error.message}` }; }
                return { ok: true };
            } catch (error) {
                if (created) try { await target.removeEntry(file.name); } catch (_) {}
                return { ok: false, error: `Niet verplaatst; de browserkopie is behouden. ${error.message}` };
            }
        }

        function openVirtualMoveFileDialog(file) {
            const dialog = document.createElement('dialog');
            dialog.className = 'file-dialog';
            dialog.innerHTML = "<form><h2><span data-i18n=\"Document verplaatsen\">Document verplaatsen</span></h2><p class=\"move-name\"></p>\n                <p><span data-i18n=\"Het document wordt eerst gecontroleerd in de doelmap. Daarna verdwijnt de browserkopie uit deze lijst.\">Het document wordt eerst gecontroleerd in de doelmap. Daarna verdwijnt de browserkopie uit deze lijst.</span></p>\n                <label><span data-i18n=\"Map zoeken\">Map zoeken</span><br><input class=\"move-search\" type=\"search\" placeholder=\"Zoek een geopende map\" style=\"width:100%;padding:10px;font:inherit\" data-i18n-placeholder=\"Zoek een geopende map\"></label>\n                <label><span data-i18n=\"Naar map\">Naar map</span><br><select required style=\"width:100%;padding:10px\"></select></label>\n                <p role=\"alert\"></p><div class=\"wp-actions\"><button type=\"button\"><span data-i18n=\"Annuleer\">Annuleer</span></button> <button class=\"action-primary\" type=\"submit\"><span data-i18n=\"Verplaatsen\">Verplaatsen</span></button></div></form>";
            dialog.querySelector('.move-name').textContent = file.relativePath;
            const search = dialog.querySelector('.move-search');
            const select = dialog.querySelector('select');
            const submit = dialog.querySelector('[type="submit"]');
            const update = () => {
                const previous = select.value;
                const paths = GereedschapskistMode.example ? [] : [...folderHandlesByPath.keys()].filter(path => path.toLocaleLowerCase('nl').includes(search.value.toLocaleLowerCase('nl'))).sort((a, b) => a.localeCompare(b, 'nl'));
                select.replaceChildren(...paths.map(path => new Option(path, path)));
                if (paths.includes(previous)) select.value = previous;
                submit.disabled = !paths.length;
                I18n.assign(dialog.querySelector('[role="alert"]'),(paths.length?'':(GereedschapskistMode.example?I18n.ui("Voorbeelden blijven apart. Open je eigen werk om dit document naar een map te verplaatsen.",'Voorbeelden blijven apart. Open je eigen werk om dit document naar een map te verplaatsen.'):(directoryHandles.length?I18n.ui("Geen map gevonden.",'Geen map gevonden.'):I18n.ui("Open eerst via Mappen een doelmap.",'Open eerst via Mappen een doelmap.')))),"textContent");
            };
            search.oninput = update;
            update();
            let busy = false;
            dialog.oncancel = event => { if (busy) event.preventDefault(); };
            dialog.querySelector('[type="button"]').onclick = () => { if (!busy) dialog.close(); };
            dialog.onclose = () => dialog.remove();
            dialog.querySelector('form').onsubmit = async event => {
                event.preventDefault();
                if (busy || !folderHandlesByPath.has(select.value)) return;
                busy = true; submit.disabled = true;
                const targetPath = select.value;
                const result = await moveVirtualFile(file, targetPath);
                if (!result.ok) { busy = false; update(); dialog.querySelector('[role="alert"]').textContent = result.error; return; }
                dialog.close();
                try {
                    await loadFiles();
                    renderFileList();
                    const index = files.findIndex(entry => entry.relativePath === `${targetPath}/${file.name}`);
                    if (index !== -1) await selectFile(index);
                    showNotification(I18n.value(I18n.ui("Verplaatst naar {0}. Bewaar alles om je werkmap bij te werken.",`Verplaatst naar ${targetPath}. Bewaar alles om je werkmap bij te werken.`)), 'success');
                } catch (_) { showNotification(I18n.value(I18n.ui("Document verplaatst. Vernieuw de map om het overzicht bij te werken.",'Document verplaatst. Vernieuw de map om het overzicht bij te werken.')), 'error'); }
            };
            document.body.append(dialog); dialog.showModal();
        }

        function openMoveFileDialog() {
            const file = activeFile;
            if (!file) return;
            if (file.isVirtual) return openVirtualMoveFileDialog(file);
            if (wysiwygDirty) { showNotification(I18n.value(I18n.ui("Sla je wijzigingen eerst op.",'Sla je wijzigingen eerst op.')), 'error'); return; }
            const sourcePath = file.relativePath.slice(0, file.relativePath.lastIndexOf('/'));
            const root = moveProjectRoot(file.relativePath);
            const dialog = document.createElement('dialog');
            dialog.className = 'file-dialog';
            dialog.innerHTML = "<form><h2><span data-i18n=\"Bestand verplaatsen\">Bestand verplaatsen</span></h2><p class=\"move-name\"></p>\n                <p class=\"move-scope\"></p>\n                <label><input class=\"move-outside\" type=\"checkbox\"> <span data-i18n=\"Ook buiten deze map\">Ook buiten deze map</span></label>\n                <label class=\"move-search-label\" style=\"display:none;margin:12px 0\"><span data-i18n=\"Map zoeken\">Map zoeken</span><br><input class=\"move-search\" type=\"search\" placeholder=\"Zoek een map\" style=\"width:100%;padding:10px;font:inherit\" data-i18n-placeholder=\"Zoek een map\"></label>\n                <label><span data-i18n=\"Naar map\">Naar map</span><br><select required style=\"width:100%;padding:10px\"></select></label>\n                <p role=\"alert\"></p><div class=\"wp-actions\"><button type=\"button\"><span data-i18n=\"Annuleer\">Annuleer</span></button> <button class=\"action-primary\" type=\"submit\"><span data-i18n=\"Verplaatsen\">Verplaatsen</span></button></div></form>";
            dialog.querySelector('.move-name').textContent = file.relativePath;
            const select = dialog.querySelector('select');
            const outside = dialog.querySelector('.move-outside');
            const search = dialog.querySelector('.move-search');
            const submit = dialog.querySelector('[type="submit"]');
            const updateDestinations = () => {
                const previous = select.value;
                dialog.querySelector('.move-search-label').style.display = 'block';
                const paths = moveDestinationPaths([...folderHandlesByPath.keys()], sourcePath, root, outside.checked, search.value);
                select.replaceChildren(...paths.map(path => new Option(path, path)));
                if (paths.includes(previous)) select.value = previous;
                submit.disabled = !paths.length;
                I18n.assign(dialog.querySelector('.move-scope'),(outside.checked?I18n.ui("Alle geopende mappen",'Alle geopende mappen'):I18n.ui("Binnen {0}",`Binnen ${root.split('/').pop()}`)),"textContent");
                I18n.assign(dialog.querySelector('[role="alert"]'),(paths.length?'':(search.value?I18n.ui("Geen map gevonden.",'Geen map gevonden.'):I18n.ui("Geen andere werkmap beschikbaar. Kies All om alle mappen te tonen.",'Geen andere werkmap beschikbaar. Kies All om alle mappen te tonen.'))),"textContent");
            };
            outside.onchange = updateDestinations;
            search.oninput = updateDestinations;
            updateDestinations();
            let busy = false;
            dialog.oncancel = event => { if (busy) event.preventDefault(); };
            dialog.querySelector('[type="button"]').onclick = () => { if (!busy) dialog.close(); };
            dialog.onclose = () => dialog.remove();
            dialog.querySelector('form').onsubmit = async event => {
                event.preventDefault();
                if (busy) return;
                busy = true; submit.disabled = true;
                const targetPath = select.value;
                if (!moveDestinationPaths([...folderHandlesByPath.keys()], sourcePath, root, outside.checked, search.value).includes(targetPath)) {
                    busy = false; updateDestinations(); return;
                }
                const result = await moveMarkdownFile(file, folderHandlesByPath.get(sourcePath), folderHandlesByPath.get(targetPath));
                if (result.ok) {
                    dialog.close();
                    try {
                        await loadFiles();
                        const newPath = `${targetPath}/${file.name}`;
                        await window.ProjectMaterials?.relocate(file.relativePath,newPath,file.name);
                        const parts = targetPath.split('/');
                        for (let i = 1; i <= parts.length; i++) expandedFolders.add(parts.slice(0, i).join('/'));
                        renderFileList();
                        const index = files.findIndex(entry => entry.relativePath === newPath);
                        if (index !== -1) await selectFile(index);
                        showNotification(I18n.value(I18n.ui("Verplaatst naar {0}",`Verplaatst naar ${targetPath}`)), 'success');
                    } catch (error) { showNotification(I18n.value(I18n.ui("Bestand is verplaatst. Vernieuw de folder om het overzicht bij te werken.",'Bestand is verplaatst. Vernieuw de folder om het overzicht bij te werken.')), 'error'); }
                } else {
                    dialog.querySelector('[role="alert"]').textContent = result.error;
                    busy = false; submit.disabled = false;
                }
            };
            document.body.append(dialog); dialog.showModal();
        }

        async function sameFileBytes(first, second) {
            if (first.size !== second.size) return false;
            const a = new Uint8Array(await first.arrayBuffer());
            const b = new Uint8Array(await second.arrayBuffer());
            return a.every((value, index) => value === b[index]);
        }

        async function moveMarkdownFile(file, source, target) {
            if (!file || file.isVirtual || !/\.md$/i.test(file.name) || !source || !target) return { ok: false, error: 'Selecteer een Markdown-bestand en een doelmap.' };
            let copied = false;
            let destinationCreated = false;
            try {
                // Start both permission requests while the submit click is still active.
                const permissions = await Promise.all([source.requestPermission({ mode: 'readwrite' }), target.requestPermission({ mode: 'readwrite' })]);
                if (permissions.some(value => value !== 'granted')) return { ok: false, error: 'Geef schrijftoegang tot beide mappen om te verplaatsen.' };
                if (await source.isSameEntry(target)) return { ok: false, error: 'Het bestand staat al in deze map.' };
                for await (const entry of target.values()) {
                    if (entry.name.toLowerCase() === file.name.toLowerCase()) return { ok: false, error: 'Er bestaat al een bestand of map met deze naam op de bestemming.' };
                }
                const original = await file.getFile();
                const destination = await target.getFileHandle(file.name, { create: true });
                destinationCreated = true;
                const writer = await destination.createWritable();
                try { await writer.write(original); await writer.close(); }
                catch (error) { try { await writer.abort(); } catch (_) {} throw error; }
                if (!await sameFileBytes(original, await destination.getFile())) throw new Error(I18n.value(I18n.ui("De kopie kon niet worden gecontroleerd.",'De kopie kon niet worden gecontroleerd.')));
                copied = true;
                const current = await source.getFileHandle(file.name);
                if (!await current.isSameEntry(file) || !await sameFileBytes(original, await current.getFile())) throw new Error(I18n.value(I18n.ui("Het bronbestand is intussen gewijzigd.",'Het bronbestand is intussen gewijzigd.')));
                await source.removeEntry(file.name);
                return { ok: true };
            } catch (error) {
                return { ok: false, error: copied
                    ? `De kopie staat in de doelmap, maar het origineel is behouden. ${error.message}`
                    : `Niet verplaatst; het origineel is behouden.${destinationCreated ? ' Controleer de mogelijk onvolledige kopie in de doelmap.' : ''} ${error.message}` };
            }
        }

        async function renameMarkdownFile(file, parent, requestedName) {
            let name = requestedName.trim();
            if (!name || name === '.' || name === '..' || /[\\/\x00-\x1f]/.test(name)) return { ok: false, error: 'Vul een bestandsnaam in zonder schuine strepen.' };
            if (!/\.md$/i.test(name)) name += '.md';
            if (!file || file.isVirtual || !parent) return { ok: false, error: 'Open eerst een lokaal Markdown-bestand.' };
            if (name === file.name) return { ok: true, name };
            let created = false;
            try {
                if (await parent.requestPermission({ mode: 'readwrite' }) !== 'granted') return { ok: false, error: 'Geef schrijftoegang om de naam te wijzigen.' };
                for await (const entry of parent.values()) {
                    if (entry.name.toLowerCase() === name.toLowerCase()) return { ok: false, error: 'Deze naam bestaat al. Kies een andere naam.' };
                }
                const original = await file.getFile();
                const destination = await parent.getFileHandle(name, { create: true });
                created = true;
                const writer = await destination.createWritable();
                try { await writer.write(original); await writer.close(); }
                catch (error) { try { await writer.abort(); } catch (_) {} throw error; }
                if (!await sameFileBytes(original, await destination.getFile())) throw new Error(I18n.value(I18n.ui("De nieuwe versie kon niet worden gecontroleerd.",'De nieuwe versie kon niet worden gecontroleerd.')));
                const current = await parent.getFileHandle(file.name);
                if (!await current.isSameEntry(file) || !await sameFileBytes(original, await current.getFile())) throw new Error(I18n.value(I18n.ui("Het oorspronkelijke bestand is intussen gewijzigd.",'Het oorspronkelijke bestand is intussen gewijzigd.')));
                await parent.removeEntry(file.name);
                return { ok: true, name };
            } catch (error) {
                return { ok: false, error: `Naam niet gewijzigd; het origineel is behouden.${created ? ' Er kan ook een kopie met de nieuwe naam staan.' : ''} ${error.message}` };
            }
        }

        function renameVirtualFile(file, requestedName) {
            let name = requestedName.trim();
            if (!name || name === '.' || name === '..' || /[\\/\x00-\x1f]/.test(name)) return { ok: false, error: 'Vul een bestandsnaam in zonder schuine strepen.' };
            if (!/\.md$/i.test(name)) name += '.md';
            const source = converterFiles.get(file.name);
            if (!file.isVirtual || !source) return { ok: false, error: 'Dit document is niet meer beschikbaar. Vernieuw de lijst.' };
            if (name === file.name) return { ok: true, name };
            if ([...converterFiles.keys()].some(key => key !== file.name && key.toLowerCase() === name.toLowerCase())) return { ok: false, error: 'Deze naam bestaat al. Kies een andere naam.' };
            const body = isEditMode && document.getElementById('wysiwygEditor') ? getWysiwygMarkdown() : source.content;
            const next = new Map(converterFiles);
            next.delete(file.name);
            next.set(name, { ...source, name, relativePath: `converter/${name}`, content: body });
            try { persistVirtualFiles(next); return { ok: true, name }; }
            catch (error) { return { ok: false, error: `Naam niet gewijzigd: ${error.message}` }; }
        }

        function openRenameFileDialog() {
            const file = activeFile;
            if (!file) return;
            const wasEditing = isEditMode;
            const parentPath = file.relativePath.slice(0, file.relativePath.lastIndexOf('/'));
            const dialog = document.createElement('dialog');
            dialog.className = 'file-dialog';
            dialog.innerHTML = "<form><h2><span data-i18n=\"Hernoemen\">Hernoemen</span></h2>\n                <label><span data-i18n=\"Bestandsnaam\">Bestandsnaam</span><br><input name=\"filename\" required autocomplete=\"off\" style=\"width:100%;padding:10px;font:inherit\"></label>\n                <p>"+(wysiwygDirty ? file.isVirtual ? 'Je tekstwijzigingen gaan mee naar de nieuwe naam. ' : 'Je tekstwijzigingen worden eerst opgeslagen. ' : '')+(file.isVirtual ? 'De browserkopie blijft in Schrijven. Bewaar alles daarna opnieuw.' : I18n.t('Het bestand blijft in dezelfde map.'))+" <span data-i18n=\"Links naar de oude naam worden niet aangepast.\">Links naar de oude naam worden niet aangepast.</span></p>\n                <p role=\"alert\"></p><div class=\"wp-actions\"><button type=\"button\"><span data-i18n=\"Annuleer\">Annuleer</span></button> <button class=\"action-primary\" type=\"submit\"><span data-i18n=\"Hernoemen\">Hernoemen</span></button></div></form>";
            const input = dialog.querySelector('input');
            input.value = file.name;
            const submit = dialog.querySelector('[type="submit"]');
            let busy = false;
            dialog.oncancel = event => { if (busy) event.preventDefault(); };
            dialog.querySelector('[type="button"]').onclick = () => { if (!busy) dialog.close(); };
            dialog.onclose = () => dialog.remove();
            dialog.querySelector('form').onsubmit = async event => {
                event.preventDefault();
                if (busy) return;
                busy = true; submit.disabled = true;
                try {
                    if (wysiwygDirty && !file.isVirtual && !(await saveFile())) throw new Error(I18n.value(I18n.ui("Sla je tekst op voordat je de naam wijzigt.",'Sla je tekst op voordat je de naam wijzigt.')));
                    const result = file.isVirtual ? renameVirtualFile(file, input.value) : await renameMarkdownFile(file, folderHandlesByPath.get(parentPath), input.value);
                    if (!result.ok) throw new Error(result.error);
                    dialog.close();
                    if (result.name === file.name) return;
                    await window.ProjectMaterials?.relocate(file.relativePath, `${parentPath}/${result.name}`, result.name);
                    const expanded = [...expandedFolders];
                    await loadFiles();
                    expanded.forEach(path => expandedFolders.add(path));
                    renderFileList();
                    const index = files.findIndex(entry => entry.relativePath === `${parentPath}/${result.name}`);
                    if (index === -1) throw new Error(I18n.value(I18n.ui("Naam gewijzigd. Vernieuw de map om het bestand te openen.",'Naam gewijzigd. Vernieuw de map om het bestand te openen.')));
                    await selectFile(index);
                    if (wasEditing) await toggleEditMode();
                    showNotification(I18n.value((file.isVirtual?I18n.ui("Bestandsnaam gewijzigd. Bewaar alles om je werkmap bij te werken.",'Bestandsnaam gewijzigd. Bewaar alles om je werkmap bij te werken.'):I18n.ui("Bestandsnaam gewijzigd",'Bestandsnaam gewijzigd'))), 'success');
                } catch (error) {
                    if (dialog.open) dialog.querySelector('[role="alert"]').textContent = error.message;
                    else showNotification(error.message, 'error');
                } finally { busy = false; submit.disabled = false; }
            };
            document.body.append(dialog); dialog.showModal();
            input.focus(); input.setSelectionRange(0, file.name.replace(/\.md$/i, '').length);
        }

        function fileMoreActions() {
            if (!activeFile) return '';
            const editingControls = isEditMode ? "<button id=\"markdownSourceToggle\" class=\"edit-btn\" title=\"De Markdown-brontekst bewerken\" onclick=\"toggleMarkdownSource()\" aria-pressed=\"false\" data-i18n-title=\"De Markdown-brontekst bewerken\"><span data-i18n=\"Markdown\">Markdown</span></button>" : "";
            const extra = activeFile.isVirtual ? '' : "<button class=\"edit-btn\" onclick=\"openRecoveryDialog()\"><span data-i18n=\"Vorige versie herstellen\">Vorige versie herstellen</span></button>";
            return "<details class=\"file-more\"><summary class=\"edit-btn\" aria-label=\"Documentacties\" data-i18n-aria-label=\"Documentacties\"><span data-i18n=\"Meer\">Meer</span></summary><div class=\"file-more-panel\" onclick=\"this.closest(&#x27;details&#x27;).open=false\">"+(editingControls)+"<button class=\"edit-btn\" onclick=\"Kladblok.toggle()\"><span data-i18n=\"Kladblok\">Kladblok</span></button><button class=\"edit-btn\" onclick=\"openDocumentExport()\"><span data-i18n=\"Exporteren…\">Exporteren…</span></button><button class=\"edit-btn\" onclick=\"ProjectMaterials.chooseDocument().catch(error=&gt;showNotification(error.message,&#x27;error&#x27;))\"><span data-i18n=\"Koppelingen…\">Koppelingen…</span></button><button class=\"edit-btn\" onclick=\"openRenameFileDialog()\"><span data-i18n=\"Hernoemen\">Hernoemen</span></button><button class=\"edit-btn\" onclick=\"openMoveFileDialog()\"><span data-i18n=\"Verplaatsen\">Verplaatsen</span></button>"+(extra)+"<button class=\"edit-btn\" id=\"focusToggle\" hidden aria-expanded=\"false\" aria-controls=\"focusPanel\" onclick=\"toggleFocus()\"><span data-i18n=\"Inhoudsopgave\">Inhoudsopgave</span></button><button class=\"edit-btn delete-file-btn\" onclick=\"openDeleteFileDialog()\"><span data-i18n=\"Verwijder\">Verwijder</span></button></div></details>";
        }

        function renderDocumentMetadata() {
            const parsed = parseFrontmatter(Kladblok.strip(currentRawContent || ''));
            return renderFrontmatter(parsed.frontmatter, true);
        }

        function fileActions() {
            return "<div class=\"file-actions\" role=\"group\" aria-label=\"Bestandsacties\" data-i18n-aria-label=\"Bestandsacties\">\n                <button class=\"edit-btn document-edit-primary action-primary\" onclick=\"toggleEditMode()\"><span data-i18n=\"Bewerk\">Bewerk</span></button>\n                <button type=\"button\" class=\"edit-btn document-material-toggle\" aria-controls=\"document-material-panel\" aria-expanded=\"false\" onclick=\"DocumentMaterials.togglePanel().catch(error=&gt;showNotification(error.message,&#x27;error&#x27;))\"><span data-i18n=\"Koppel\">Koppel</span></button>"+(fileMoreActions())+"\n                    "+(documentFocusButton())+"\n            </div>";
        }

        async function saveAndCloseEditor() {
            if (await saveFile()) await toggleEditMode();
        }

        function renderFileView(rawContent) {
            Kladblok.load(rawContent);
            rawContent=Kladblok.strip(rawContent);
            const { frontmatter, content } = parseFrontmatter(rawContent);

            let html = DOMPurify.sanitize(marked.parse(content));

            // Process wiki-links [[...]] into clickable links
            html = processWikiLinks(html);

            // Highlight search terms in content if searching
            if (currentSearchQuery) {
                const regex = new RegExp(`(${escapeRegex(currentSearchQuery)})`, 'gi');
                html = html.replace(regex, "<span class=\"highlight\">$1</span>");
            }

            const backlinks = getBacklinks(activeFile);
            const backlinksHtml = renderBacklinks(backlinks);

            document.getElementById('content').innerHTML = "\n                <div class=\"content-header\"><details class=\"document-information\"><summary data-i18n=\"Documentgegevens\">Documentgegevens</summary><span class=\"file-path-heading\" title=\""+(escapeHtml(activeFile?.relativePath || ""))+"\" data-i18n-title=\"{0}\"><span class=\"document-name\">"+(escapeHtml(activeFile?.name || activeFile?.relativePath?.split("/").pop() || ""))+"</span><span class=\"document-folder\">"+(activeFile?.isVirtual?I18n.t("Los document · browserkopie"): "Map: "+escapeHtml(activeFile?.relativePath?.split("/").slice(0, -1).join(" / ") || I18n.t("Geen map")))+"</span></span>"+(renderDocumentMetadata())+"</details>\n                    "+(fileActions(false))+"<span class=\"document-save-status\">"+(activeFile?.isVirtual?(window.Werkmap?.active?I18n.t("Bewaar schrijft dit document naar je werkmap"):I18n.t("Bewaar downloadt dit document naar je computer")):escapeHtml(I18n.value(I18n.ui("Opgeslagen in {0}","Opgeslagen in "+activeFile.relativePath))))+"</span>\n                </div>\n                <div class=\"markdown-content\">\n                    \n                    "+(html)+"\n                    "+(backlinksHtml)+"\n                </div>\n            ";
            window.ProjectMaterials?.showDocumentProject(activeFile);
            renderYouTubePlayers(document.querySelector("#content .markdown-content"));
        }

        async function toggleEditMode() {
            if (!activeFile) return;

            if (isEditMode) {
                if (wysiwygDirty && !(await saveFile())) return;
                isEditMode = false;
                document.getElementById('content').classList.remove('editing');
                renderFileView(currentRawContent);
            } else {
                isEditMode = true;
                document.getElementById('content').classList.add('editing');
                renderEditorView();
            }
        }

        function highlightMarkdown(text) {
            // Escape HTML first
            let html = escapeHtml(text);

            // Track if we're in a code block to avoid highlighting inside it
            const lines = html.split('\n');
            let inCodeBlock = false;
            let inFrontmatter = false;
            let frontmatterStart = false;

            const highlightedLines = lines.map((line, index) => {
                // Check for frontmatter at start of document
                if (index === 0 && line === '---') {
                    inFrontmatter = true;
                    frontmatterStart = true;
                    return "<span class=\"md-frontmatter-delimiter\">"+(line)+"</span>";
                }

                // Check for end of frontmatter
                if (inFrontmatter && line === '---') {
                    inFrontmatter = false;
                    return "<span class=\"md-frontmatter-delimiter\">"+(line)+"</span>";
                }

                // Frontmatter content
                if (inFrontmatter) {
                    return "<span class=\"md-frontmatter\">"+(line)+"</span>";
                }

                // Check for code block delimiters
                if (line.match(/^```/)) {
                    inCodeBlock = !inCodeBlock;
                    return "<span class=\"md-code-block\">"+(line)+"</span>";
                }

                // Inside code block - no highlighting
                if (inCodeBlock) {
                    return "<span class=\"md-code-block\">"+(line)+"</span>";
                }

                // Headers
                if (line.match(/^#{1,6}\s/)) {
                    return "<span class=\"md-header\">"+(line)+"</span>";
                }

                // Citaats
                if (line.match(/^&gt;\s/)) {
                    return "<span class=\"md-blockquote\">"+(line)+"</span>";
                }

                // Horizontale lijns
                if (line.match(/^(---|\*\*\*|___)\s*$/)) {
                    return "<span class=\"md-hr\">"+(line)+"</span>";
                }

                // Task lists
                if (line.match(/^(\s*[-*+]\s+)\[x\]/i)) {
                    line = line.replace(/^(\s*[-*+]\s+)(\[x\])/i, "<span class=\"md-list\">$1</span><span class=\"md-task-checked\">$2</span>");
                    return highlightInline(line);
                }
                if (line.match(/^(\s*[-*+]\s+)\[\s\]/)) {
                    line = line.replace(/^(\s*[-*+]\s+)(\[\s\])/, "<span class=\"md-list\">$1</span><span class=\"md-task\">$2</span>");
                    return highlightInline(line);
                }

                // Unordered lists
                if (line.match(/^\s*[-*+]\s/)) {
                    line = line.replace(/^(\s*[-*+]\s)/, "<span class=\"md-list\">$1</span>");
                    return highlightInline(line);
                }

                // Ordered lists
                if (line.match(/^\s*\d+\.\s/)) {
                    line = line.replace(/^(\s*\d+\.\s)/, "<span class=\"md-list\">$1</span>");
                    return highlightInline(line);
                }

                // Regular line - apply inline highlighting
                return highlightInline(line);
            });

            return highlightedLines.join('\n');
        }

        function highlightInline(line) {
            // Images (must come before links)
            line = line.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "<span class=\"md-image\">![$1]($2)</span>");

            // Wiki-links [[target]] and [[target|display]]
            line = line.replace(/(\[\[[^\]]+?\]\])/g, "<span class=\"md-wikilink\">$1</span>");

            // Links
            line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<span class=\"md-link\">[$1]</span>(<span class=\"md-link-url\">$2</span>)");

            // Code (must come before bold/italic to avoid conflicts)
            line = line.replace(/`([^`]+)`/g, "<span class=\"md-code\">`$1`</span>");

            // Vet (** or __)
            line = line.replace(/(\*\*|__)(?=\S)([^\*_]+?)(?<=\S)\1/g, "<span class=\"md-bold\">$1$2$1</span>");

            // Cursief (* or _) - be careful not to match inside words
            line = line.replace(/(\*|_)(?=\S)([^\*_]+?)(?<=\S)\1/g, "<span class=\"md-italic\">$1$2$1</span>");

            // Doorhalen
            line = line.replace(/~~([^~]+)~~/g, "<span class=\"md-strikethrough\">~~$1~~</span>");

            return line;
        }

        function createTurndownService() {
            const td = new TurndownService({
                headingStyle: 'atx',
                hr: '---',
                bulletListMarker: '-',
                codeBlockStyle: 'fenced',
                fence: '```',
                emDelimiter: '*',
                strongDelimiter: '**',
                linkStyle: 'inlined'
            });

            // Use GFM plugin for tables, strikethrough, etc.
            if (window.turndownPluginGfm) {
                td.use(turndownPluginGfm.gfm);
            }

            td.addRule('portableStrikethrough', {
                filter: ['del', 's', 'strike'],
                replacement: content => '~~' + content + '~~'
            });
            td.addRule('editableTasks', {
                filter: node => node.nodeName === 'INPUT' && node.type === 'checkbox' && node.closest('li'),
                replacement: (content, node) => (node.checked ? '[x]' : '[ ]') + ' '
            });
            td.addRule('documentLinks', {
                filter: node => node.nodeName === 'SPAN' && node.hasAttribute('data-internal-target'),
                replacement: (content, node) => '[[' + node.getAttribute('data-internal-target') + '|' + node.textContent + ']]'
            });
            // Preserve wiki-links that appear as literal [[...]] text
            td.addRule('preserveWikiLinks', {
                filter: function(node) {
                    return node.nodeType === 3 && /\[\[.+?\]\]/.test(node.textContent);
                },
                replacement: function(content) {
                    return content;
                }
            });

            return td;
        }

        function toggleMarkdownSource() {
            const source = document.getElementById('markdownSource');
            const editor = document.getElementById('wysiwygEditor');
            const toolbar = editor.parentElement.querySelector('.wysiwyg-toolbar');
            const button = document.getElementById('markdownSourceToggle');
            if (source.hidden) {
                source.value = getWritingMarkdown();
                source.hidden = false;
                editor.style.display = 'none';
                toolbar.style.display = 'none';
                I18n.assign(button,I18n.ui("Visueel",'Visueel'),"textContent");
                I18n.assign(button,I18n.ui("Tekst met opmaak bewerken",'Tekst met opmaak bewerken'),"title");
                button.setAttribute('aria-pressed', 'true');
                source.focus();
            } else {
                const wrapped = source.value.trim().match(/^```(?:markdown|md)?[ \t]*\n([\s\S]*?)\n```$/i);
                if (wrapped && /^\s*#{1,6}\s+\S/m.test(wrapped[1])) {
                    source.value = wrapped[1];
                    wysiwygDirty = true;
                }
                const match = source.value.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
                wysiwygFrontmatterRaw = match ? match[0] : '';
                editor.innerHTML = DOMPurify.sanitize(marked.parse(source.value.slice(wysiwygFrontmatterRaw.length)));
                renderInternalLinks(editor, true);
                prepareTaskLists(editor);
                source.dataset.visualSnapshot = editor.innerHTML;
                source.hidden = true;
                editor.style.display = '';
                toolbar.style.display = '';
                I18n.assign(button,I18n.ui("Markdown",'Markdown'),"textContent");
                I18n.assign(button,I18n.ui("De Markdown-brontekst bewerken",'De Markdown-brontekst bewerken'),"title");
                button.setAttribute('aria-pressed', 'false');
                offerMarkdownCodeConversion(editor);
                updateWysiwygModifiedState();
                editor.focus();
            }
        }

        function getWysiwygMarkdown() { return Kladblok.attach(getWritingMarkdown()); }

        function getWritingMarkdown() {
            const source = document.getElementById('markdownSource');
            if (source && !source.hidden) return source.value;
            const editor = document.getElementById('wysiwygEditor');
            if (!editor) return currentRawContent;
            if (source && source.dataset.visualSnapshot === editor.innerHTML) return source.value;

            const td = createTurndownService();
            syncTaskCheckboxes(editor);
            let bodyMarkdown = td.turndown(editor.innerHTML);

            // Reconstruct full content with frontmatter
            if (wysiwygFrontmatterRaw) {
                return wysiwygFrontmatterRaw + bodyMarkdown + '\n';
            }
            return bodyMarkdown + '\n';
        }

        function formatWysiwyg(command, value = null) {
            const editor = document.getElementById('wysiwygEditor');
            if (!editor) return;
            editor.focus();
            document.execCommand(command, false, value);
            wysiwygDirty = true;
            updateWysiwygModifiedState();
        }

        function updateWysiwygModifiedState() {
            const saveButton = document.getElementById('editorSaveButton');
            if (saveButton) {
                saveButton.disabled = !wysiwygDirty;
                I18n.assign(saveButton,(wysiwygDirty?I18n.ui("Wijzigingen opslaan",'Wijzigingen opslaan'):I18n.ui("Geen wijzigingen om op te slaan",'Geen wijzigingen om op te slaan')),"title");
            }
            const modifiedEl = document.getElementById('editorModified');
            if (!modifiedEl) return;
            if (wysiwygDirty) {
                I18n.assign(modifiedEl,I18n.ui("Niet opgeslagen",'Niet opgeslagen'),"textContent");
                modifiedEl.className = 'modified';
            } else {
                I18n.assign(modifiedEl,(activeFile?.isVirtual?I18n.ui("Los document in deze browser",'Los document in deze browser'):I18n.ui("Opgeslagen in {0}",'Opgeslagen in '+activeFile.relativePath)),"textContent");
                modifiedEl.className = '';
            }
        }

        function continueHeadingAsParagraph(event, editor) {
            if (event.inputType !== 'insertParagraph' || event.isComposing || !event.cancelable) return;
            const selection = window.getSelection();
            if (!selection.rangeCount || !selection.isCollapsed) return;
            const range = selection.getRangeAt(0);
            const element = range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer;
            const heading = element.closest('h1,h2,h3,h4,h5,h6');
            if (!heading || !editor.contains(heading)) return;
            const remaining = range.cloneRange();
            remaining.selectNodeContents(heading);
            remaining.setStart(range.startContainer, range.startOffset);
            const tail = remaining.cloneContents();
            if (tail.textContent.length || tail.querySelector('img,video,iframe,[contenteditable="false"]')) return;
            event.preventDefault();
            if (document.execCommand('insertParagraph', false, null)) {
                document.execCommand('formatBlock', false, "<p>");
                wysiwygDirty = true;
                updateWysiwygModifiedState();
            }
        }

        function wysiwygFormatBlock(tag) {
            const editor = document.getElementById('wysiwygEditor');
            if (!editor) return;
            editor.focus();

            // Check if currently in the same block type - toggle off to paragraph
            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                const node = sel.anchorNode;
                const parentBlock = node.nodeType === 3 ? node.parentElement : node;
                const currentBlock = parentBlock.closest(tag);
                if (currentBlock && editor.contains(currentBlock)) {
                    document.execCommand('formatBlock', false, "<p>");
                    wysiwygDirty = true;
                    updateWysiwygModifiedState();
                    return;
                }
            }

            document.execCommand('formatBlock', false, `<${tag}>`);
            wysiwygDirty = true;
            updateWysiwygModifiedState();
        }

        function wysiwygInsertLink() {
            const editor = document.getElementById('wysiwygEditor');
            if (!editor) return;

            const sel = window.getSelection();
            const selectedText = sel.toString();
            const url = prompt(I18n.value(I18n.ui("Vul een link in:",'Vul een link in:')), 'https://');
            if (url && !/^(https?:|mailto:)/i.test(url.trim())) { showNotification(I18n.value(I18n.ui("Gebruik een http-, https- of mailto-link.",'Gebruik een http-, https- of mailto-link.')), 'error'); return; }
            if (url) {
                editor.focus();
                if (selectedText) {
                    document.execCommand('createLink', false, url);
                } else {
                    const linkHtml = "<a href=\""+(url)+"\">"+(url)+"</a>";
                    document.execCommand('insertHTML', false, linkHtml);
                }
                wysiwygDirty = true;
                updateWysiwygModifiedState();
            }
        }

        function wysiwygInsertInternalLink() { openInternalLinkDialog(); }

        function wysiwygToggleCode() {
            const editor = document.getElementById('wysiwygEditor');
            if (!editor) return;
            editor.focus();

            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const selectedText = sel.toString();

                // Check if already in code tag
                const codeParent = sel.anchorNode.parentElement.closest('code');
                if (codeParent && !codeParent.closest('pre')) {
                    // Unwrap code
                    const text = document.createTextNode(codeParent.textContent);
                    codeParent.parentNode.replaceChild(text, codeParent);
                } else if (selectedText) {
                    const code = document.createElement('code');
                    range.surroundContents(code);
                }
                wysiwygDirty = true;
                updateWysiwygModifiedState();
            }
        }

        function convertMarkdownCodeBlock() {
            const editor = document.getElementById('wysiwygEditor');
            if (!editor) return;
            const blocks = [...editor.querySelectorAll('pre')].filter(block => /^\s*#{1,6}\s+\S/m.test(block.textContent));
            if (!blocks.length) return;
            for (const block of blocks) {
                const html = DOMPurify.sanitize(marked.parse(block.textContent));
                const fragment = document.createRange().createContextualFragment(html);
                block.replaceWith(fragment);
            }
            prepareTaskLists(editor);
            wysiwygDirty = true;
            updateWysiwygModifiedState();
            document.getElementById('convertMarkdownBlock')?.remove();
            editor.focus();
        }

        function offerMarkdownCodeConversion(editor) {
            const exists = [...editor.querySelectorAll('pre')].some(block => /^\s*#{1,6}\s+\S/m.test(block.textContent));
            let button = document.getElementById('convertMarkdownBlock');
            if (!exists) { button?.remove(); return; }
            if (button) return;
            button = document.createElement('button');
            button.id = 'convertMarkdownBlock';
            button.type = 'button';
            button.className = 'edit-btn';
            I18n.assign(button,I18n.ui("Markdown opmaken",'Markdown opmaken'),"textContent");
            I18n.assign(button,I18n.ui("Zet Markdown in een codeblok om naar koppen, lijsten en tabellen",'Zet Markdown in een codeblok om naar koppen, lijsten en tabellen'),"title");
            button.onclick = convertMarkdownCodeBlock;
            document.getElementById('markdownSourceToggle').before(button);
        }

        function clipboardDocumentHtml(text, html) {
            const plain = (text || '').replace(/\r\n?/g, '\n');
            const wrapped = plain.trim().match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
            let markdown = wrapped ? wrapped[1] : plain;
            if (!markdown.trim() && html) {
                const probe = document.createElement('div');
                probe.innerHTML = DOMPurify.sanitize(html);
                const code = probe.querySelector('pre');
                if (code) markdown = code.textContent;
            }
            const hasMarkdown = wrapped || /^(?:#{1,6} |[-*+] |\d+\. |> )\S/m.test(markdown) || /^\|.*\|\s*\n\|[ :|\-]+\|/m.test(markdown);
            if (hasMarkdown) return DOMPurify.sanitize(marked.parse(markdown));
            if (html) {
                const cleaned = DOMPurify.sanitize(html, {FORBID_TAGS:['style'], FORBID_ATTR:['style','class','hidden']});
                const probe = document.createElement('div');
                probe.innerHTML = cleaned;
                if (probe.textContent.trim() || probe.querySelector('img,hr,table')) return cleaned;
            }
            return plain.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, "<br>");
        }

        function renderEditorView() {
            Kladblok.load(currentRawContent);
            const writingContent=Kladblok.strip(currentRawContent);
            const shortcutKey = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';

            // Parse frontmatter - preserve raw frontmatter, only edit body
            const fmRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
            const fmMatch = writingContent.match(fmRegex);
            wysiwygFrontmatterRaw = fmMatch ? fmMatch[0] : '';
            const bodyMarkdown = fmMatch ? writingContent.slice(fmMatch[0].length) : writingContent;

            // Convert body markdown to HTML for WYSIWYG editing (no wiki-link processing)
            const editorBody = document.createElement('div');
            editorBody.innerHTML = DOMPurify.sanitize(marked.parse(bodyMarkdown));
            renderInternalLinks(editorBody, true);
            const bodyHtml = editorBody.innerHTML;
            wysiwygDirty = false;

            document.getElementById('content').innerHTML = "\n                <div class=\"content-header\"><details class=\"document-information\"><summary data-i18n=\"Documentgegevens\">Documentgegevens</summary><span class=\"file-path-heading\" title=\""+(escapeHtml(activeFile?.relativePath || ""))+"\" data-i18n-title=\"{0}\"><span class=\"document-name\">"+(escapeHtml(activeFile?.name || activeFile?.relativePath?.split("/").pop() || ""))+"</span><span class=\"document-folder\">"+(activeFile?.isVirtual?I18n.t("Los document · browserkopie"): "Map: "+escapeHtml(activeFile?.relativePath?.split("/").slice(0, -1).join(" / ") || I18n.t("Geen map")))+"</span></span>"+(renderDocumentMetadata())+"</details>\n                    <span id=\"editorModified\" class=\"document-save-status\" role=\"status\"></span><div class=\"file-actions editor-actions\" role=\"group\" aria-label=\"Bewerk\" data-i18n-aria-label=\"Bewerk\">\n                    \n                    \n                    <button class=\"cancel-btn\" onclick=\"cancelEdit()\" title=\"Annuleer bewerking\" data-i18n-title=\"Annuleer bewerking\">\n                        <svg xmlns=\"http://www.w3.org/2000/svg\" viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n                            <line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"></line>\n                            <line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"></line>\n                        </svg>\n                        <span data-i18n=\"Annuleer\">Annuleer</span>\n                    </button>\n                    <button id=\"editorSaveButton\" class=\"save-btn action-primary\" disabled onclick=\"saveAndCloseEditor()\" title=\"Geen wijzigingen om op te slaan\" data-i18n-title=\"Geen wijzigingen om op te slaan\">\n                        <svg xmlns=\"http://www.w3.org/2000/svg\" viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n                            <path d=\"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z\"></path>\n                            <polyline points=\"17 21 17 13 7 13 7 21\"></polyline>\n                            <polyline points=\"7 3 7 8 15 8\"></polyline>\n                        </svg>\n                        "+(I18n.t('Bewaar'))+"\n                    </button>\n                    <button type=\"button\" class=\"edit-btn document-material-toggle\" aria-controls=\"document-material-panel\" aria-expanded=\"false\" onclick=\"DocumentMaterials.togglePanel().catch(error=&gt;showNotification(error.message,&#x27;error&#x27;))\"><span data-i18n=\"Koppel\">Koppel</span></button>"+(fileMoreActions())+"\n                    "+(documentFocusButton())+"\n                    </div>\n                </div>\n                <div class=\"editor-container visible\">\n                    <div class=\"editor-wrapper wysiwyg-mode\">\n                        <div class=\"wysiwyg-toolbar\">\n                            <button onclick=\"formatWysiwyg(&#x27;bold&#x27;)\" title=\"Vet ("+(shortcutKey)+"+B)\" data-i18n-title=\"Vet ({6}+B)\"><strong><span data-i18n=\"B\">B</span></strong></button>\n                            <button onclick=\"formatWysiwyg(&#x27;italic&#x27;)\" title=\"Cursief ("+(shortcutKey)+"+I)\" data-i18n-title=\"Cursief ({7}+I)\"><em><span data-i18n=\"I\">I</span></em></button>\n                            <button onclick=\"formatWysiwyg(&#x27;strikeThrough&#x27;)\" title=\"Doorhalen\" data-i18n-title=\"Doorhalen\"><s><span data-i18n=\"S\">S</span></s></button>\n                            <div class=\"separator\"></div>\n                            <button onclick=\"wysiwygFormatBlock(&#x27;h1&#x27;)\" title=\"Kop 1\" data-i18n-title=\"Kop 1\"><span data-i18n=\"H1\">H1</span></button>\n                            <button onclick=\"wysiwygFormatBlock(&#x27;h2&#x27;)\" title=\"Kop 2\" data-i18n-title=\"Kop 2\"><span data-i18n=\"H2\">H2</span></button>\n                            <button onclick=\"wysiwygFormatBlock(&#x27;h3&#x27;)\" title=\"Kop 3\" data-i18n-title=\"Kop 3\"><span data-i18n=\"H3\">H3</span></button>\n                            <div class=\"separator\"></div>\n                            <button onclick=\"formatWysiwyg(&#x27;insertUnorderedList&#x27;)\" title=\"Opsomming\" data-i18n-title=\"Opsomming\">\n                                <svg viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><line x1=\"8\" y1=\"6\" x2=\"21\" y2=\"6\"/><line x1=\"8\" y1=\"12\" x2=\"21\" y2=\"12\"/><line x1=\"8\" y1=\"18\" x2=\"21\" y2=\"18\"/><circle cx=\"4\" cy=\"6\" r=\"1\" fill=\"currentColor\"/><circle cx=\"4\" cy=\"12\" r=\"1\" fill=\"currentColor\"/><circle cx=\"4\" cy=\"18\" r=\"1\" fill=\"currentColor\"/></svg>\n                            </button>\n                            <button class=\"task-list-button\" onmousedown=\"event.preventDefault()\" onclick=\"insertTaskList()\" title=\"Afvinkbare takenlijst\" aria-label=\"Takenlijst\" data-i18n-title=\"Afvinkbare takenlijst\" data-i18n-aria-label=\"Takenlijst\"><svg viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" aria-hidden=\"true\"><path d=\"m3 6 2 2 4-4\"/><rect x=\"3\" y=\"14\" width=\"5\" height=\"5\" rx=\"1\"/><path d=\"M12 6h9M12 16.5h9\"/></svg></button>\n                            <button onclick=\"formatWysiwyg(&#x27;insertOrderedList&#x27;)\" title=\"Genummerde lijst\" data-i18n-title=\"Genummerde lijst\">\n                                <svg viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><line x1=\"10\" y1=\"6\" x2=\"21\" y2=\"6\"/><line x1=\"10\" y1=\"12\" x2=\"21\" y2=\"12\"/><line x1=\"10\" y1=\"18\" x2=\"21\" y2=\"18\"/><text x=\"4\" y=\"7\" font-size=\"7\" fill=\"currentColor\" stroke=\"none\" font-family=\"monospace\">1</text><text x=\"4\" y=\"13\" font-size=\"7\" fill=\"currentColor\" stroke=\"none\" font-family=\"monospace\">2</text><text x=\"4\" y=\"19\" font-size=\"7\" fill=\"currentColor\" stroke=\"none\" font-family=\"monospace\">3</text></svg>\n                            </button>\n                            <div class=\"separator\"></div>\n                            <button onclick=\"wysiwygFormatBlock(&#x27;blockquote&#x27;)\" title=\"Citaat\" data-i18n-title=\"Citaat\">\n                                <svg viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z\"/><path d=\"M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z\"/></svg>\n                            </button>\n                            <button onclick=\"wysiwygToggleCode()\" title=\"Code\" data-i18n-title=\"Code\">\n                                <svg viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"16 18 22 12 16 6\"/><polyline points=\"8 6 2 12 8 18\"/></svg>\n                            </button>\n                            <div class=\"separator\"></div>\n                            <button onmousedown=\"event.preventDefault()\" onclick=\"wysiwygInsertInternalLink()\" title=\"Link naar document\" aria-label=\"Link naar document\" style=\"width:auto;min-width:36px;font-weight:600\" data-i18n-title=\"Link naar document\" data-i18n-aria-label=\"Link naar document\">[[…]]</button>\n                            <button onmousedown=\"event.preventDefault()\" onclick=\"DocumentMaterials.addImage(activeFile).catch(error=>showNotification(error.message,&#x27;error&#x27;))\" title=\"Afbeelding koppelen\" aria-label=\"Afbeelding koppelen\" data-i18n-title=\"Afbeelding koppelen\" data-i18n-aria-label=\"Afbeelding koppelen\"><svg viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><circle cx=\"8\" cy=\"8\" r=\"1.5\"/><path d=\"m21 15-5-5L5 21\"/></svg></button>\n                            <button onmousedown=\"event.preventDefault()\" onclick=\"openMediaDialog(&#x27;youtube&#x27;)\" title=\"YouTube-video toevoegen\" aria-label=\"YouTube-video toevoegen\" data-i18n-title=\"YouTube-video toevoegen\" data-i18n-aria-label=\"YouTube-video toevoegen\"><svg viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" aria-hidden=\"true\"><rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"3\"/><path d=\"m10 8 6 4-6 4z\"/></svg></button>\n                            <button onclick=\"wysiwygInsertLink()\" title=\"Link invoegen\" data-i18n-title=\"Link invoegen\">\n                                <svg viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\"/><path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\"/></svg>\n                            </button>\n                            <button onclick=\"formatWysiwyg(&#x27;insertHorizontalRule&#x27;)\" title=\"Horizontale lijn\" data-i18n-title=\"Horizontale lijn\">\n                                <svg viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><line x1=\"2\" y1=\"12\" x2=\"22\" y2=\"12\" stroke-width=\"3\"/></svg>\n                            </button>\n                        </div>\n                        <textarea id=\"markdownSource\" hidden aria-label=\"Kale Markdown\" spellcheck=\"false\" style=\"box-sizing:border-box;width:100%;min-height:60vh;padding:24px;font:16px/1.6 monospace;resize:vertical;background:var(--bg-primary);color:var(--text-primary);border:1px solid #888\" data-i18n-aria-label=\"Kale Markdown\"></textarea>\n                        <div class=\"wysiwyg-editor markdown-content\" contenteditable=\"true\" id=\"wysiwygEditor\" spellcheck=\"true\">"+(bodyHtml)+"</div>\n                    </div>\n                    <div class=\"editor-status\">\n                        <span class=\"editor-shortcut-hint\">"+(shortcutKey)+"<span data-i18n=\"+B vet ·\">+B vet ·</span> "+(shortcutKey)+"<span data-i18n=\"+I cursief ·\">+I cursief ·</span> "+(shortcutKey)+"<span data-i18n=\"+S Bewaar alles · Esc sluit menu of venster\">+S Bewaar alles · Esc sluit menu of venster</span></span>\n                    </div>\n                </div>\n            ";
            window.ProjectMaterials?.showDocumentProject(activeFile);

            const editor = document.getElementById('wysiwygEditor');
            editor.focus();
            editor.addEventListener('beforeinput', event => continueHeadingAsParagraph(event, editor));
            offerMarkdownCodeConversion(editor);

            const source = document.getElementById('markdownSource');
            source.value = writingContent;
            source.dataset.visualSnapshot = editor.innerHTML;
            source.addEventListener('input', () => {
                wysiwygDirty = true;
                updateWysiwygModifiedState();
            });
            prepareTaskLists(editor);
            editor.addEventListener('change', event => {
                if (event.target.matches('input[type=checkbox]')) {
                    syncTaskCheckboxes(editor);
                    wysiwygDirty = true; updateWysiwygModifiedState();
                }
            });
            // Track modifications
            editor.addEventListener('input', () => {
                prepareTaskLists(editor);
                offerMarkdownCodeConversion(editor);
                wysiwygDirty = true;
                updateWysiwygModifiedState();
            });

            // Handle paste - clean up pasted HTML
            editor.addEventListener('paste', (e) => {
                const clipboardData = e.clipboardData || window.clipboardData;
                const html = clipboardData.getData('text/html');
                const text = clipboardData.getData('text/plain');

                if (html || text) {
                    e.preventDefault();
                    document.execCommand('insertHTML', false, clipboardDocumentHtml(text, html));
                    prepareTaskLists(editor);
                }

                wysiwygDirty = true;
                updateWysiwygModifiedState();
            });
        }

        function cancelEdit() {
            if (!activeFile) return;

            if (wysiwygDirty) {
                if (!confirm(I18n.value(I18n.ui("Je hebt wijzigingen die niet zijn opgeslagen. Wil je die weggooien?",'Je hebt wijzigingen die niet zijn opgeslagen. Wil je die weggooien?')))) {
                    return;
                }
            }

            // Revert to original content
            currentRawContent = originalRawContent;
            wysiwygDirty = false;
            isEditMode = false;
            document.getElementById('content').classList.remove('editing');
            renderFileView(currentRawContent);
        }

        async function saveFile() {
            await Werkmap.recall();
            if(activeFile?.isVirtual && window.Werkmap?.active)return await Werkmap.save();
            if (!activeFile) return;

            const editor = document.getElementById('wysiwygEditor');
            if (!editor && activeFile.isVirtual) return;

            // A connected document always writes back to its own file.
            const newContent = editor ? getWysiwygMarkdown() : currentRawContent;

            try {
                if (activeFile.isVirtual) {
                    // Save virtual (converter) file
                    const fileData = converterFiles.get(activeFile.name);
                    if (!fileData) throw Error(I18n.value(I18n.ui("Dit document is niet meer beschikbaar. Je tekst blijft in de editor; download zo nodig eerst een kopie.",'Dit document is niet meer beschikbaar. Je tekst blijft in de editor; download zo nodig eerst een kopie.')));
                    fileData.content = newContent;
                    converterFiles.set(activeFile.name, fileData);
                    saveConverterFiles();
                    downloadLooseMarkdown(activeFile.name,newContent);
                } else {
                    // Save real file via File System Access API
                    // Need write permission on the directory
                    const folderHandle = directoryHandles.find(h => h.name === activeFile.folderName);
                    if (folderHandle) {
                        const hasWritePermission = await verifyPermission(folderHandle, 'readwrite');
                        if (!hasWritePermission) {
                            showNotification(I18n.value(I18n.ui("Geen toestemming om op te slaan",'Geen toestemming om op te slaan')), 'error');
                            return;
                        }
                    }

                    if (await (await activeFile.getFile()).text() !== originalRawContent) throw Error(I18n.value(I18n.ui("Dit bestand is buiten Schrijven gewijzigd. Je bewerking blijft in de editor; heropen het bestand voordat je verdergaat.",'Dit bestand is buiten Schrijven gewijzigd. Je bewerking blijft in de editor; heropen het bestand voordat je verdergaat.')));
                    // Get a writable stream from the file handle
                    await replaceWithRecovery(activeFile, folderHandlesByPath.get(activeFile.relativePath.split('/').slice(0,-1).join('/')), originalRawContent, newContent);
                }

                // Update cached content
                fileContents.set(activeFile.relativePath, newContent);
                renderFileList();
                currentRawContent = newContent;
                originalRawContent = newContent;
                wysiwygDirty = false;

                updateWysiwygModifiedState();
                const savedMessage = activeFile.isVirtual ? I18n.t('Download gestart; controleer je bestand.') : I18n.value(I18n.ui('Opgeslagen in {0}','Opgeslagen in '+activeFile.relativePath));
                const modifiedEl = document.getElementById('editorModified');
                if (modifiedEl) modifiedEl.textContent = savedMessage;
                if(!activeFile.isVirtual){
                    Werkstatus.opened(activeFile.relativePath);Werkstatus.written();
                    const status=document.getElementById('wm-message');if(status)status.textContent=savedMessage;
                }
                showNotification(savedMessage, 'success');
                return true;
            } catch (err) {
                console.error('Bewaar mislukt:', err);
                const message='Niet opgeslagen: '+err.message;
                const status=document.getElementById('wm-message');if(status)status.textContent=message;
                showNotification(message, 'error');
                return false;
            }
        }

        function toggleSidebar() {
            document.querySelector('.sidebar').classList.toggle('open');
            document.querySelector('.overlay').classList.toggle('visible');
        }

        // Search Palette functionality
        let paletteResults = [];
        let paletteSelectedIndex = 0;
        let paletteSearchTimeout = null;

        function openSearchPalette() {
            const sharedSearch = document.getElementById('suite-search');
            if (sharedSearch) { if (document.getElementById('suite-search-bar')?.hidden) document.getElementById('suite-search-toggle')?.click(); sharedSearch.focus(); sharedSearch.select(); return; }
            const overlay = document.getElementById('searchPaletteOverlay');
            const input = document.getElementById('searchPaletteInput');

            overlay.classList.add('visible');
            input.value = '';
            input.focus();

            paletteResults = projectFiles().slice(0, 20).map(f => ({ file: f, matchPreview: null }));
            paletteSelectedIndex = 0;

            // Show all files initially if we have files loaded
            if (files.length > 0) {
                renderPaletteResults(projectFiles().slice(0, 20).map(f => ({ file: f, matchPreview: null })));
                I18n.assign(document.getElementById('searchPaletteStats'),I18n.ui("{0} bestanden",`${projectFiles().length} bestanden`),"textContent");
            } else {
                document.getElementById('searchPaletteResults').innerHTML = "\n                    <div class=\"search-palette-empty\">\n                        <svg xmlns=\"http://www.w3.org/2000/svg\" viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\">\n                            <path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z\"></path>\n                        </svg>\n                        <p><span data-i18n=\"Open eerst een map om te zoeken\">Open eerst een map om te zoeken</span></p>\n                    </div>\n                ";
                document.getElementById('searchPaletteStats').textContent = '';
            }
        }

        function closeSearchPalette(event) {
            if (event && event.target !== event.currentTarget) return;
            document.getElementById('searchPaletteOverlay').classList.remove('visible');
            paletteResults = [];
            paletteSelectedIndex = 0;
        }

        function searchPalette(query) {
            if (!query) {
                // Show recent/all files
                if (files.length > 0) {
                    paletteResults = projectFiles().slice(0, 20).map(f => ({ file: f, matchPreview: null }));
                    renderPaletteResults(paletteResults);
                    I18n.assign(document.getElementById('searchPaletteStats'),I18n.ui("{0} bestanden",`${projectFiles().length} bestanden`),"textContent");
                }
                return;
            }

            const queryLower = query.toLowerCase();
            const results = [];
            let totalMatches = 0;

            for (const file of projectFiles()) {
                const nameMatch = file.relativePath.toLowerCase().includes(queryLower);
                const content = fileContents.get(file.relativePath) || '';
                const contentLower = content.toLowerCase();
                const contentMatch = contentLower.includes(queryLower);

                if (nameMatch || contentMatch) {
                    let matchPreview = null;
                    let matchCount = 0;

                    if (contentMatch) {
                        let pos = 0;
                        while ((pos = contentLower.indexOf(queryLower, pos)) !== -1) {
                            matchCount++;
                            pos += queryLower.length;
                        }
                        totalMatches += matchCount;

                        const matchIndex = contentLower.indexOf(queryLower);
                        const start = Math.max(0, matchIndex - 40);
                        const end = Math.min(content.length, matchIndex + query.length + 40);
                        let preview = content.substring(start, end);

                        if (start > 0) preview = '...' + preview;
                        if (end < content.length) preview = preview + '...';

                        matchPreview = highlightText(preview.replace(/\n/g, ' '), query);
                    }

                    results.push({
                        file,
                        nameMatch,
                        contentMatch,
                        matchCount,
                        matchPreview
                    });
                }
            }

            // Sort: name matches first, then by match count
            results.sort((a, b) => {
                if (a.nameMatch && !b.nameMatch) return -1;
                if (!a.nameMatch && b.nameMatch) return 1;
                return b.matchCount - a.matchCount;
            });

            paletteResults = results.slice(0, 50);
            paletteSelectedIndex = 0;

            renderPaletteResults(paletteResults, query);

            if (results.length > 0) {
                const fileText = results.length === 1 ? 'bestand' : 'bestanden';
                document.getElementById('searchPaletteStats').textContent =
                    `${results.length} ${fileText}${totalMatches > 0 ? ` · ${totalMatches} treffers` : ''}`;
            } else {
                I18n.assign(document.getElementById('searchPaletteStats'),I18n.ui("Geen resultaten",'Geen resultaten'),"textContent");
            }
        }

        function renderPaletteResults(results, query = '') {
            const container = document.getElementById('searchPaletteResults');

            if (results.length === 0) {
                container.innerHTML = "\n                    <div class=\"search-palette-empty\">\n                        <svg xmlns=\"http://www.w3.org/2000/svg\" viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\">\n                            <circle cx=\"11\" cy=\"11\" r=\"8\"></circle>\n                            <path d=\"m21 21-4.35-4.35\"></path>\n                        </svg>\n                        <p><span data-i18n=\"Geen bestanden gevonden\">Geen bestanden gevonden</span></p>\n                    </div>\n                ";
                return;
            }

            container.innerHTML = results.map((result, index) => {
                const selectedClass = index === paletteSelectedIndex ? 'selected' : '';
                const displayPath = query ? highlightText(result.file.relativePath, query) : escapeHtml(result.file.relativePath);

                return "\n                    <div class=\"search-palette-item "+(selectedClass)+"\" data-index=\""+(index)+"\" onclick=\"selectPaletteItem("+(index)+")\" onmouseenter=\"paletteSelectedIndex = "+(index)+"; updatePaletteSelection()\">\n                        <svg xmlns=\"http://www.w3.org/2000/svg\" viewbox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n                            <path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"></path>\n                            <polyline points=\"14 2 14 8 20 8\"></polyline>\n                        </svg>\n                        <div class=\"search-palette-item-content\">\n                            <div class=\"search-palette-item-path\">"+(displayPath)+"</div>\n                            "+(result.matchPreview ? "<div class=\"search-palette-item-preview\">"+(result.matchPreview)+"</div>" : '')+"\n                        </div>\n                    </div>\n                ";
            }).join('');
        }

        function updatePaletteSelection() {
            const items = document.querySelectorAll('.search-palette-item');
            items.forEach((item, index) => {
                item.classList.toggle('selected', index === paletteSelectedIndex);
            });

            // Scroll selected item into view
            const selected = document.querySelector('.search-palette-item.selected');
            if (selected) {
                selected.scrollIntoView({ block: 'nearest' });
            }
        }

        function selectPaletteItem(index) {
            if (paletteResults[index]) {
                const fileIndex = files.findIndex(f => f.relativePath === paletteResults[index].file.relativePath);
                if (fileIndex !== -1) {
                    closeSearchPalette();
                    selectFile(fileIndex);
                }
            }
        }

        // Search palette input handler
        document.getElementById('searchPaletteInput').addEventListener('input', (e) => {
            clearTimeout(paletteSearchTimeout);
            paletteSearchTimeout = setTimeout(() => {
                searchPalette(e.target.value);
            }, 100);
        });

        // Search palette keyboard navigation
        document.getElementById('searchPaletteInput').addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (paletteSelectedIndex < paletteResults.length - 1) {
                    paletteSelectedIndex++;
                    updatePaletteSelection();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (paletteSelectedIndex > 0) {
                    paletteSelectedIndex--;
                    updatePaletteSelection();
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                selectPaletteItem(paletteSelectedIndex);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const paletteVisible = document.getElementById('searchPaletteOverlay').classList.contains('visible');

            // Cmd/Ctrl + K to open search palette
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (paletteVisible) {
                    closeSearchPalette();
                } else {
                    openSearchPalette();
                }
            }
            // Cmd/Ctrl + E to toggle edit mode
            if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
                e.preventDefault();
                if (activeFile && !paletteVisible) {
                    toggleEditMode();
                }
            }
            // Cmd/Ctrl + S to save in edit mode
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                if (isEditMode) {
                    e.preventDefault();
                    saveFile();
                }
            }
            // Escape to close palette or cancel edit
            if (e.key === 'Escape') {
                if (paletteVisible) {
                    closeSearchPalette();
                } else if (isEditMode && !document.querySelector('dialog[open]')) {
                    cancelEdit();
                }
            }
        });

        // Check for File System Access API support
        if (!('showDirectoryPicker' in window)) {
            document.getElementById('newFileBtn').disabled = false;
            for (const button of document.querySelectorAll('[data-template]')) button.disabled = false;
            document.getElementById('fileList').innerHTML = "\n                <div class=\"empty-state\">\n                    <span data-i18n=\"Deze browser kan geen lokale mappen openen.\">Deze browser kan geen lokale mappen openen.</span><br><br>\n                    <span data-i18n=\"Open Schrijven in Chrome of Edge op je computer.\">Open Schrijven in Chrome of Edge op je computer.</span>\n                </div>\n            ";
            if (converterFiles.size) restoreSavedFolders();
        } else {
            // Try to restore previously opened folder
            // restoreSavedFolders will handle loading files including converter files
            restoreSavedFolders();
        }



        // Wiki-link click handler (delegated)
        document.getElementById('content').addEventListener('click', function(e) {
            const wikilink = e.target.closest('.wikilink[data-wiki-target]');
            if (wikilink) {
                e.preventDefault();
                const idx = parseInt(wikilink.dataset.wikiTarget, 10);
                if (!isNaN(idx) && idx >= 0 && idx < files.length) {
                    selectFile(idx);
                }
            }
        });

        document.getElementById('content').addEventListener('keydown', event => {
            if (event.key === 'Enter' && event.target.matches('.wikilink[data-wiki-target]')) { event.preventDefault(); event.target.click(); }
        });

        // Sidebar resize functionality
        (function() {
            const resizeHandle = document.getElementById('sidebarResize');
            const app = document.getElementById('app');
            const sidebar = document.getElementById('sidebar');

            let isResizing = false;
            let startX = 0;
            let startWidth = 0;

            resizeHandle.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                startWidth = sidebar.offsetWidth;

                resizeHandle.classList.add('dragging');
                document.body.classList.add('resizing');

                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;

                const delta = e.clientX - startX;
                let newWidth = startWidth + delta;

                // Clamp to min/max
                newWidth = Math.max(200, Math.min(500, newWidth));

                app.style.setProperty('--sidebar-width', `${newWidth}px`);
            });

            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    resizeHandle.classList.remove('dragging');
                    document.body.classList.remove('resizing');

                    // Save to localStorage
                    const width = sidebar.offsetWidth;
                    GereedschapskistMode.storage.setItem('sidebarWidth', width);
                }
            });

            // Restore saved width
            const savedWidth = GereedschapskistMode.storage.getItem('sidebarWidth');
            if (savedWidth) {
                app.style.setProperty('--sidebar-width', `${savedWidth}px`);
            }
        })();

        function htmlToMarkdown(html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            return convertNode(doc.body).trim();
        }

        function convertNode(node) {
            let result = '';

            for (const child of node.childNodes) {
                if (child.nodeType === Node.TEXT_NODE) {
                    result += child.textContent;
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const tagName = child.tagName.toLowerCase();

                    switch (tagName) {
                        case 'h1':
                            result += '\n# ' + getTextContent(child) + '\n\n';
                            break;
                        case 'h2':
                            result += '\n## ' + getTextContent(child) + '\n\n';
                            break;
                        case 'h3':
                            result += '\n### ' + getTextContent(child) + '\n\n';
                            break;
                        case 'h4':
                            result += '\n#### ' + getTextContent(child) + '\n\n';
                            break;
                        case 'h5':
                            result += '\n##### ' + getTextContent(child) + '\n\n';
                            break;
                        case 'h6':
                            result += '\n###### ' + getTextContent(child) + '\n\n';
                            break;
                        case 'p':
                            const pContent = convertNode(child).trim();
                            if (pContent) {
                                result += pContent + '\n\n';
                            }
                            break;
                        case 'strong':
                        case 'b':
                            result += '**' + convertNode(child) + '**';
                            break;
                        case 'em':
                        case 'i':
                            result += '*' + convertNode(child) + '*';
                            break;
                        case 'u':
                            result += "<u>"+(convertNode(child))+"</u>";
                            break;
                        case 'strike':
                        case 's':
                        case 'del':
                            result += '~~' + convertNode(child) + '~~';
                            break;
                        case 'a':
                            const href = child.getAttribute('href') || '';
                            const linkText = convertNode(child);
                            result += '[' + linkText + '](' + href + ')';
                            break;
                        case 'ul':
                            result += '\n' + convertList(child, false) + '\n';
                            break;
                        case 'ol':
                            result += '\n' + convertList(child, true) + '\n';
                            break;
                        case 'li':
                            result += convertNode(child);
                            break;
                        case 'br':
                            result += '  \n';
                            break;
                        case 'hr':
                            result += '\n---\n\n';
                            break;
                        case 'table':
                            result += '\n' + convertTable(child) + '\n';
                            break;
                        case 'blockquote':
                            const quoteContent = convertNode(child).trim().split('\n');
                            result += '\n' + quoteContent.map(line => '> ' + line).join('\n') + '\n\n';
                            break;
                        case 'code':
                            result += '`' + getTextContent(child) + '`';
                            break;
                        case 'pre':
                            result += '\n```\n' + getTextContent(child) + '\n```\n\n';
                            break;
                        case 'img':
                            const alt = child.getAttribute('alt') || '';
                            const src = child.getAttribute('src') || '';
                            result += '![' + alt + '](' + src + ')';
                            break;
                        case 'sup':
                            result += "<sup>"+(convertNode(child))+"</sup>";
                            break;
                        case 'sub':
                            result += "<sub>"+(convertNode(child))+"</sub>";
                            break;
                        default:
                            result += convertNode(child);
                    }
                }
            }

            return result;
        }

        function getTextContent(node) {
            return convertNode(node).trim();
        }

        function convertList(listNode, ordered, depth = 0) {
            let result = '';
            const indent = '  '.repeat(depth);
            let counter = 1;

            for (const child of listNode.children) {
                if (child.tagName.toLowerCase() === 'li') {
                    const prefix = ordered ? `${counter}. ` : '- ';
                    let liContent = '';

                    for (const liChild of child.childNodes) {
                        if (liChild.nodeType === Node.TEXT_NODE) {
                            liContent += liChild.textContent.trim();
                        } else if (liChild.nodeType === Node.ELEMENT_NODE) {
                            const tag = liChild.tagName.toLowerCase();
                            if (tag === 'ul') {
                                liContent += '\n' + convertList(liChild, false, depth + 1);
                            } else if (tag === 'ol') {
                                liContent += '\n' + convertList(liChild, true, depth + 1);
                            } else {
                                liContent += convertNode(liChild);
                            }
                        }
                    }

                    result += indent + prefix + liContent.trim() + '\n';
                    counter++;
                }
            }

            return result;
        }

        function convertTable(tableNode) {
            let result = '';
            const rows = tableNode.querySelectorAll('tr');

            if (rows.length === 0) return '';

            rows.forEach((row, rowIndex) => {
                const cells = row.querySelectorAll('th, td');
                const cellContents = Array.from(cells).map(cell =>
                    convertNode(cell).trim().replace(/\|/g, '\\|').replace(/\n/g, ' ')
                );

                result += '| ' + cellContents.join(' | ') + ' |\n';

                if (rowIndex === 0) {
                    result += '| ' + cellContents.map(() => '---').join(' | ') + ' |\n';
                }
            });

            return result;
        }

        function showNotification(message, type = 'success') {
            // Create notification element if it doesn't exist
            let notification = document.getElementById('converterNotification');
            if (!notification) {
                notification = document.createElement('div');
                notification.id = 'converterNotification';
                notification.style.cssText = `
                    position: fixed;
                    bottom: 24px;
                    left: 50%;
                    transform: translate(-50%, 100%);
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 13px;
                    font-weight: 500;
                    z-index: 10000;
                    transition: transform 0.3s ease;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                `;
                document.body.appendChild(notification);
            }

            const colors = {
                success: { bg: '#28A745', color: 'white' },
                error: { bg: '#DC3545', color: 'white' },
                info: { bg: '#1E90FF', color: 'white' }
            };

            const style = colors[type] || colors.success;
            notification.style.background = style.bg;
            notification.style.color = style.color;
            notification.textContent = message;
            notification.style.transform = 'translate(-50%, 0)';

            setTimeout(() => {
                notification.style.transform = 'translate(-50%, 100%)';
            }, 3000);
        }
