import ImageCrop from "./ImageCrop";
import { useContext } from "react";
import axios from 'axios';
import { UserContext } from "../UserContext";
import { Modal } from "./Modal";

export const ProfilePicModal = (props) => {
    const userInfo = useContext(UserContext);
    const { closeModal } = props;

    const sendPic = (formData) => {
        axios.post('/api/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'username': userInfo.username
            }
        }).then(result => {
            window.location.reload();
        });
    };

    return (
        <Modal closeModal={closeModal}>
            <ImageCrop sendNewPicture={sendPic} />
        </Modal>
    );
};

export default ProfilePicModal;
