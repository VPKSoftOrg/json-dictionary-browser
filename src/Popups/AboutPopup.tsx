import { Button, Modal } from "antd";
import classNames from "classnames";
import * as React from "react";
import { styled } from "styled-components";
import * as Package from "../../package.json";
import { GithubLogo, GithubLogoWhite, LogoImage, NetlifyLogo } from "../Utilities/Images";

/**
 * The props for the {@link AboutPopup} component.
 */
type AboutPopupProps = {
    /** The class name for the component. */
    className?: string;
    /** A value indicating whether dark mode is enabled. */
    darkMode: boolean;
    /** A value indicating whether this popup is visible. */
    visible: boolean;
    /** Occurs when the popup has been closed. */
    onClose: () => void;
};

const appVersion = Package.version;
const appName = Package.description;

let AboutPopup = ({
    className, //
    visible,
    darkMode,
    onClose,
}: AboutPopupProps) => {
    // Open my GitHub profile URL when the corresponding component is clicked.
    const openVPKSoftUrl = React.useCallback(() => {
        void open("https://github.com/VPKSoft");
    }, []);

    // Open the github.com URL when the corresponding component is clicked.
    const openGitHubUrl = React.useCallback(() => {
        void open("https://github.com/VPKSoftOrg/json-dictionary-browser");
    }, []);

    // Open the latest release from the netlify.app.
    const openNetlifyUrl = React.useCallback(() => {
        void open("https://json-dictionary-browser.netlify.app");
    }, []);

    return (
        <Modal //
            title={`About - ${appName}`}
            onOk={onClose}
            open={visible}
            width={700}
            onCancel={onClose}
            centered
            footer={null}
        >
            <div className={classNames(AboutPopup.name, className)}>
                <div className="Popup-versionText">{`${appName}, Copyright © 2025 VPKSoft, v.${appVersion}`}</div>
                <div className="Popup-licenseText">License</div>
                <div className="Popup-licenseContent">
                    {`MIT License

Copyright (c) 2025 Petteri Kautonen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE."
                `}
                </div>
                <div className="LogoImages">
                    <img src={LogoImage} className="LogoImage" onClick={openVPKSoftUrl} />

                    <img src={darkMode ? GithubLogoWhite : GithubLogo} className="LogoImage" onClick={openGitHubUrl} />

                    <img src={NetlifyLogo} className="LogoImage" onClick={openNetlifyUrl} />
                </div>
                <div className="Popup-ButtonRow">
                    <Button //
                        onClick={onClose}
                    >
                        Ok
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

AboutPopup = styled(AboutPopup)`
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 500px;
    .Popup-versionText {
        font-weight: bolder;
        margin-bottom: 10px;
    }
    .Popup-licenseText {
        font-weight: bolder;
        margin-bottom: 10px;
    }
    .Popup-licenseContent {
        white-space: pre-wrap;
        overflow: auto;
        font-family: monospace;
    }
    .Popup-ButtonRow {
        display: flex;
        width: 100%;
        flex-direction: row;
        justify-content: flex-end;
    }
    .LogoImages {
        display: flex;
        flex-direction: row;
        height: 100px;
        justify-content: space-evenly;
    }
    .LogoImage {
        cursor: pointer;
        max-width: 33%;
        max-height: 100%;        
        object-fit: contain;
    }
`;

export { AboutPopup };
