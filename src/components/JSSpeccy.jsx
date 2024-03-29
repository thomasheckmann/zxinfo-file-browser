/**
 * Integrating the JSSpeccy emulator By Matt Westcott into zxinfo-file-browser
 * https://github.com/gasman/jsspeccy3
 * JSSpeccy 3 is licensed under the GPL version 3 - see COPYING.
 *
 * Because of security, it's not possible to load a file local dierctly by render
 *
 * - files to open, needs to be in the /public/tmp in this project
 */
import * as React from "react";
import { useEffect } from "react";
import { useState } from "react";

import { mylog } from "../App";
import { Container } from "@mui/material";

var emuInst = null;
var scriptNode = null;

export default function JSSpeccy(props) {
  const { fileItem } = props;
  const [loaded, setLoaded] = useState(false);
  const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

  const loadJSSpeccy = async (callback) => {
    const existingScript = document.getElementById("JSSpeccy_JS");
    if (!existingScript) {
      mylog("JSSpeccy", "loadJSSpeccy", `adding jsspeccy.js script to DOM`);
      const script = document.createElement("script");
      scriptNode = script;
      script.src = "./jsspeccy/jsspeccy.js";
      script.id = "JSSpeccy_JS";
      document.body.appendChild(script);
      script.onload = () => {
        if (callback) callback();
        mylog("JSSpeccy", "loadJSSpeccy", `script loaded...`);
      };
    }
    if (existingScript && callback) callback();
  };

  const startJSSpeccy = (e) => {
    mylog("JSSpeccy", "startJSSpeccy", `starting emulator: ${e}`);

    async function launchJSSpeccy(e) {
      const tmpFile = await window.electronAPI.getFileForJSSpeccy(e);
      mylog("JSSpeccy", "startJSSpeccy(launchJSSpeccy)", `${JSON.stringify(fileItem)} - file to launch: ${tmpFile}`);

      // Adjust JSSpeccy3 options for TAP/TZX based on found machinetype
      var machinetype = "48";
      switch (fileItem.machinetype) {
        case "ZX-Spectrum 16K":
        case "ZX-Spectrum 48K":
        case "ZX-Spectrum 16K/48K":
          machinetype = "48";
          break;
        case "ZX-Spectrum 128K":
        case "ZX-Spectrum 48K/128K":
        case "ZX-Spectrum 128 +2":
        case "ZX-Spectrum 128 +2B":
          machinetype = "128";
          break;
        default:
          mylog("JSSpeccy", "startJSSpeccy(launchJSSpeccy)", `machinetype NOT defined, using hwmodel: ${fileItem.hwmodel}`);
          if(fileItem.hwmodel === "128k") {
            machinetype = "128";
          } else {
            machinetype = "48";
          }
          break;
      }

      var tapeAutoLoadMode = "";
      if (fileItem.comments === "(load in USR0 mode)") {
        machinetype = "128";
        tapeAutoLoadMode = "usr0";
      }
      // Always enable tapeTraps for TAP files
      var tapeTrapsEnabled = false;
      if (fileItem.type === "tapfmt") {
        tapeTrapsEnabled = true;
      }

      mylog("JSSpeccy", "startJSSpeccy(launchJSSpeccy)", `machine: ${machinetype}, tapeAutoLoadMode: ${tapeAutoLoadMode}, tapeTrapsEnabled: ${tapeTrapsEnabled}`);

      let emu = window.JSSpeccy(window.document.getElementById("jsspeccy"), {
        // in developtment, only resources in public
        // in prod, files
        openUrl: isDev ? tmpFile : `file://${tmpFile}`,
        machine: machinetype,
        sandbox: true,
        autoStart: true,
        autoLoadTapes: true,
        tapeTrapsEnabled: tapeTrapsEnabled,
        tapeAutoLoadMode: tapeAutoLoadMode,
        zoom: 2,
      });
      emuInst = emu;
    }

    launchJSSpeccy(e);
  };

  useEffect(() => {
    mylog("JSSpeccy", "useEffect", `loaded: ${loaded}`);

    if (!loaded) {
      loadJSSpeccy(() => {
        setLoaded(true);
        startJSSpeccy(fileItem);
      });
    }

    return () => {
      mylog("JSSpeccy", "useEffect", `shutting down....`);
      if (emuInst) {
        mylog("JSSpeccy", "useEffect", `exit() - emulator`);
        emuInst.exit();
        emuInst = null;
      }
      if (scriptNode) {
        mylog("JSSpeccy", "useEffect", `removing script...`);
        document.body.removeChild(scriptNode);
        scriptNode = null;
      }
      setLoaded(false);
    };
  }, []);

  return (
    <Container style={{ display: "flex", justifyContent: "center" }}>
      <div id="jsspeccy"></div>
    </Container>
  );
}
