import ReactCrop, { centerCrop, convertToPercentCrop, convertToPixelCrop, makeAspectCrop } from 'react-image-crop';
import "react-image-crop/dist/ReactCrop.css";
import { useRef, useState } from 'react';

const MIN_WIDTH = 150;
const ASPECT_RATIO = 1;

const ImageCrop = (props) => {

    const { sendNewPicture } = props;

    const canvasRef = useRef(null);
    const imgRef = useRef(null);

    const [imgName, setImgName] = useState('');
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState('');
    const [error, setError] = useState('');

    const onSelectFile = (e) => {
        const file = e.target.files?.[0];
        if(!file) return;

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            if(error) setError('');

            const img = new Image();
            const imgUrl = reader.result?.toString() || '';
            img.src = imgUrl;

            img.addEventListener('load', (e) => {
                const { naturalWidth, naturalHeight } = e.currentTarget;

                if(naturalWidth < MIN_WIDTH || naturalHeight < MIN_WIDTH) {
                    setError('Image must be at least 150x150');
                    setImgSrc('');
                    return;
                }
            });

            setImgSrc(imgUrl);
            setImgName(file.name);
        });
        reader.readAsDataURL(file);
    };

    const onImgLoad = (e) => {
        console.log(e.currentTarget.width, e.currentTarget.height);
        const { width, height } = e.currentTarget;
        const cropWidth = (MIN_WIDTH / width) * 100;

        const crop = makeAspectCrop(
            {
                unit: "%",
                width: cropWidth
            },
            ASPECT_RATIO,
            width,
            height
        );

        const centeredCrop = centerCrop(crop, width, height);
        setCrop(centeredCrop);
    };

    const drawCrop = (img, canvas, crop) => {
        const ctx = canvas.getContext('2d');

        const pixelRatio = window.devicePixelRatio;
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;

        canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
        canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

        ctx.scale(pixelRatio, pixelRatio);
        ctx.imageSmoothingQuality = "high";
        ctx.save();

        const cropX = crop.x * scaleX;
        const cropY = crop.y * scaleY;

        ctx.translate(-cropX, -cropY);
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, img.naturalWidth, img.naturalHeight);

        ctx.restore();
    }

    const sendImage = () => {
        // draw cropped image to canvas
        drawCrop(imgRef.current, canvasRef.current, convertToPixelCrop(crop, imgRef.current.width, imgRef.current.height));
        
        // upload image to sync-skat server
        canvasRef.current.toBlob((blob) => {
            const formData = new FormData();
            formData.append('pfp', blob, imgName);

            sendNewPicture(formData);
        });
    };

    return (
        <main className="profile-pic-upload-content">
            <div className="title semi-bold">New Profile Pic</div>
            <div className="profile-pic-help-text">Select a new profile picture from your device</div>
            {!imgSrc && (
                <>
                    <label htmlFor="file-upload" className="custom-file-upload border-s round-m">
                        <span>Upload</span>
                        <i className="fa fa-solid fa-upload"></i>
                    </label>
                    <input id="file-upload" type="file" accept="image/*" onChange={onSelectFile} />
                </>
            )}
            {error && <p style={{color: '#AA4A44', fontWeight: 600}}>{error}</p>}
            
            {imgSrc && (
                <div className="image-update-form">
                        <ReactCrop 
                            crop={crop} 
                            onChange={(pxCrop, percentCrop) => setCrop(percentCrop)}
                            circularCrop 
                            keepSelection 
                            ruleOfThirds
                            aspect={ASPECT_RATIO} 
                            minWidth={MIN_WIDTH}
                            className="round-l border-m"
                        >
                            <img ref={imgRef} alt="New Upload" src={imgSrc} style={{ maxHeight: '50vh' }} onLoad={onImgLoad}/>
                        </ReactCrop>

                    <button className="custom-file-upload border-s round-m regular" onClick={sendImage}>
                        Set Profile Picture
                    </button>
                </div>
            )}

            {crop && <canvas ref={canvasRef} style={{display: 'none'}}/>}
        </main>
    );
};

export default ImageCrop;