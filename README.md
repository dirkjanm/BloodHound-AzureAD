# BloodHound with Azure AD capabilities
This is a fork of the BloodHound UI containing Azure AD features. This project is part of ROADtools and currently in alpha stage. This means that things work but that you may have to write your own Cypher queries to see the results you need and that clicking on Azure AD specific node types won't always work or show useful results.

Data ingestion is done using [ROADrecon](https://github.com/dirkjanm/ROADrecon) and its BloodHound plugin. For more info, see the [ROADrecon release blog](https://dirkjanm.io/introducing-roadtools-azure-ad-exploration-framework/).

To run the GUI, for now you need `node` installed to build it yourself with `npm install` and `npm run dev`. I'm planning on adding binary releases, but they aren't there yet. For instructions, see <https://github.com/BloodHoundAD/BloodHound/wiki/Running-the-Development-Version-of-BloodHound> (but instead of the official bloodhound specify this repository to clone from).

# License
GPLv3 in line with original BloodHound
