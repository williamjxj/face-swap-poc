import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import Image from 'next/image'
import { ImageProps } from 'next/image'

type LazyComponentProps = {
  component: string
  fallback?: React.ReactNode
  ssr?: boolean
  props: any
}

export default function LazyComponent({
  component,
  fallback,
  ssr = false,
  props = {},
}: LazyComponentProps) {
  // Special case for the Image component from next/image
  if (component === 'Image') {
    // Ensure props includes required src and alt for Image
    const imageProps: ImageProps = {
      src: props.src || '',
      alt: props.alt || '',
      width: props.width || 100,
      height: props.height || 100,
      ...props,
    }

    return (
      <Suspense fallback={fallback || <div className="w-full h-full bg-gray-200 animate-pulse" />}>
        <Image {...imageProps} alt={imageProps.alt} />
      </Suspense>
    )
  }

  // For all other components, use dynamic import
  const DynamicComponent = dynamic(() => import(`./${component}`), {
    loading: () => fallback || <div className="w-full h-full bg-gray-200 animate-pulse" />,
    ssr,
  })

  return (
    <Suspense fallback={fallback || <div className="w-full h-full bg-gray-200 animate-pulse" />}>
      <DynamicComponent {...props} />
    </Suspense>
  )
}
