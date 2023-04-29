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
      script.src = "./jsspeccy/jsspeccy.js";
      script.id = "JSSpeccy_JS";
      document.body.appendChild(script);
      script.onload = () => {
        scriptNode = script;
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
      mylog("JSSpeccy", "startJSSpeccy(launchJSSpeccy)", `file to launch: ${tmpFile}`);
      let emu = window.JSSpeccy(window.document.getElementById("jsspeccy"), {
        // openUrl: tmpFile,
        // in developtment, only resources in public
        // in prod, files
        openUrl: isDev ? tmpFile : `file://${tmpFile}`,
        autoStart: true,
        tapeTrapsEnabled: true,
        tapeAutoLoadMode: "usr0",
        autoLoadTapes: true,
        machine: "128",
        sandbox: true,
        zoom: 2,
      });
      emuInst = emu;
    }

    launchJSSpeccy(e);
  };

  useEffect(() => {
    mylog("JSSpeccy", "useEffect", `${loaded}`);

    if (!loaded) {
      loadJSSpeccy(() => {
        setLoaded(true);
      });
    }

    return () => {
      mylog("JSSpeccy", "useEffect", `shutting down....`);
      if (emuInst) {
        mylog("JSSpeccy", "useEffect", `exit() - emulator`);
        emuInst.exit();
      }
      if (scriptNode) {
        mylog("JSSpeccy", "useEffect", `removing script...`);
        document.body.removeChild(scriptNode);
        setLoaded(false);
      }
    };
  }, []);

  return (
    <Container style={{ display: "flex", justifyContent: "center" }}>
      <div id="jsspeccy"></div>
      {loaded && startJSSpeccy(fileItem)}
    </Container>
  );
}
