"use client";
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from "lucide-react";
import { Icon } from '@iconify/react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import toast from "react-hot-toast";

const MAX_FILE_SIZE_KB = 400; // Maximum file size in kilobytes

const ImageUploader = ({ onImageUpload }) => {
    const [preview, setPreview] = useState(null);

    const onDrop = useCallback(acceptedFiles => {
        const file = acceptedFiles[0];

        if (file.size > MAX_FILE_SIZE_KB * 1024) {
            toast.error(`File size exceeds ${MAX_FILE_SIZE_KB}KB. Please select a smaller file.`);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            setPreview(base64String);
            onImageUpload(base64String); // Pass the base64 string to parent component
        };
        reader.readAsDataURL(file);
    }, [onImageUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
        },
        maxFiles: 1,
        onDrop
    });

    const removeImage = () => {
        setPreview(null);
        onImageUpload(null); // Clear the image in the parent component
    };

    return (
        <div>
            {preview ? (
                <div className="relative rounded-xl">
                    <img src={preview} alt="Preview" className="w-full h-48 object-contain rounded-md rounded-xl" />
                    <Button
                        type="button"
                        className="absolute top-2 right-2 bg-default-900 hover:bg-background hover:text-default-900 z-20"
                        onClick={removeImage}
                    >
                        <span className="text-xl color-red"><Icon icon="fa6-solid:xmark" /></span>
                    </Button>
                </div>
            ) : (
                <div {...getRootProps({ className: `dropzone ${isDragActive ? 'active' : ''}` })}>
                    <input {...getInputProps()} />
                    <div className="w-full text-center border-dashed border rounded-md py-[52px] flex items-center flex-col">
                        <div className="h-12 w-12 inline-flex rounded-md bg-muted items-center justify-center mb-3">
                            <Upload className="text-default-500" />
                        </div>
                        <h4 className="text-2xl font-medium mb-1 text-card-foreground/80">
                            Drop image here or click to upload.
                        </h4>
                        <div className="text-xs text-muted-foreground">
                            (Max file size: 400KB)
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;