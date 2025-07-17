import { useState, useEffect } from "react";

const FullscreenButton = () => {
    const [isFullscreen, setIsFullscreen] = useState(document.fullscreenElement != null);

    useEffect(() => {
        const externalFullscreenChange = () => {
            setIsFullscreen(document.fullscreenElement != null);
        }
        window.addEventListener('fullscreenchange', externalFullscreenChange);
        return () => {
            window.removeEventListener('fullscreenchange', externalFullscreenChange);
        }
    });

    const handleFullscreen = (e) => {
        if(!isFullscreen) {
            if(document.body.requestFullscreen)
                document.body.requestFullscreen();
            else if(document.body.webkitRequestFullscreen)
                document.body.webkitRequestFullscreen();
            else if(document.body.msRequestFullscreen)
                document.body.msRequestFullscreen();
            setIsFullscreen(true);
        } else {
            if(document.exitFullscreen)
                document.exitFullscreen();
            else if(document.webkitExitFullscreen)
                document.webkitExitFullscreen();
            else if(document.msExitFullscreen)
                document.msExitFullscreen();
            setIsFullscreen(false);
        }
    }
    
    return (
        <>
            {document.fullscreenEnabled && 
                <button className="circle border-m fullscreen-btn" onClick={handleFullscreen}>
                    <i className={isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand'}></i>
                </button>
            }
        </>
    );
}

export default FullscreenButton;