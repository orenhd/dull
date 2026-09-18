# Dull

Dull makes a refined, Israeli take on extreme-metal band T-shirts from the 80s and 90s, for Gen X and anyone interested in the era. Capstone project, course 45900.2 · AI Product Design & UX/UI, John Bryce.

## Links

- **[Live product](https://dull.onrender.com/)**
- **[Case study](https://dull.onrender.com/case-study/)** - goes live once the build step described in [backend/README.md](backend/README.md) is wired in
- **[Presentation](https://docs.google.com/presentation/d/1RBvEmXR9PjiKB5_0EHey9iEXW26yIcNl/edit?usp=sharing&ouid=113052457340020895504&rtpof=true&sd=true)** - best opened from Google Drive rather than PowerPoint

  In PowerPoint, some of the Hebrew/English language transitions don't render correctly. The file was built by Claude directly as OOXML (not via LibreOffice - LibreOffice was only used to render QA screenshots during the build, not to generate the file itself). The likely cause of the gap: the RTL/bidi attributes for the mixed Hebrew/English text weren't fully encoded in the XML, and Google Slides renders that more leniently than PowerPoint does.

## Development and deployment

For technical details on running locally and deploying on Render, see [backend/README.md](backend/README.md).
