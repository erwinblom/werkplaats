// Makersproef; dit is niet de aangekondigde agenda-export.
WerkplaatsUitbreiding.start(function(api) {
  api.addAction({
    label: api.language === 'en' ? 'Download task example' : 'Download takenvoorbeeld',
    async run() {
      const session = await api.readTool('Projectbord');
      await api.download('werkplaats-takenvoorbeeld.json', JSON.stringify(session.data, null, 2), 'application/json');
    }
  });
});
