'use client'
import Image from "next/image";

export default function PlaceholderImage() {
    return (
        <Image
            src="/placeholder-image.jpg"
            alt="Placeholder Image"
            width={500}
            height={500}
        />
    )
}