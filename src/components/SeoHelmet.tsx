import React from 'react'
import { useLocation } from 'react-router-dom'

interface SeoHelmetProps {
  title?: string
  description?: string
  image?: string
  type?: string
  url?: string
  keywords?: string
  article?: {
    publishedTime?: string
    modifiedTime?: string
    author?: string
    section?: string
    tags?: string[]
  }
}

const SeoHelmet: React.FC<SeoHelmetProps> = ({
  title = 'Learn Options Trading Academy - Master Options Trading Risk-Free',
  description = 'Master options trading with our comprehensive learning platform. Practice with real market data, learn Greeks, explore strategies, and build confidence before risking real money. Free educational courses!',
  image = 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg',
  type = 'website',
  url,
  keywords = 'options trading, learn options, paper trading, options simulator, trading education, options greeks, trading strategies, risk-free trading, options courses, trading academy',
  article
}) => {
  const location = useLocation()
  const baseUrl = 'https://learnoptionstrading.academy'
  const currentUrl = url || `${baseUrl}${location.pathname}`
  const siteName = 'Learn Options Trading Academy'

  // Update document metadata
  React.useEffect(() => {
    document.title = title

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, name)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    // Basic meta tags
    updateMetaTag('description', description)
    updateMetaTag('keywords', keywords)

    // Open Graph tags
    updateMetaTag('og:title', title, 'property')
    updateMetaTag('og:description', description, 'property')
    updateMetaTag('og:type', type, 'property')
    updateMetaTag('og:url', currentUrl, 'property')
    updateMetaTag('og:image', image, 'property')
    updateMetaTag('og:image:secure_url', image, 'property')
    updateMetaTag('og:image:width', '1200', 'property')
    updateMetaTag('og:image:height', '630', 'property')
    updateMetaTag('og:site_name', siteName, 'property')
    updateMetaTag('og:locale', 'en_US', 'property')

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', 'name')
    updateMetaTag('twitter:title', title, 'name')
    updateMetaTag('twitter:description', description, 'name')
    updateMetaTag('twitter:image', image, 'name')
    updateMetaTag('twitter:url', currentUrl, 'name')

    // Additional article meta tags if provided
    if (article && type === 'article') {
      if (article.publishedTime) {
        updateMetaTag('article:published_time', article.publishedTime, 'property')
      }
      if (article.modifiedTime) {
        updateMetaTag('article:modified_time', article.modifiedTime, 'property')
      }
      if (article.author) {
        updateMetaTag('article:author', article.author, 'property')
      }
      if (article.section) {
        updateMetaTag('article:section', article.section, 'property')
      }
    }

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', currentUrl)

  }, [title, description, image, type, currentUrl, keywords, article])

  return null
}

export default SeoHelmet