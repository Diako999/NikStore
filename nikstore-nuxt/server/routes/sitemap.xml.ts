export default defineEventHandler(async (event) => {
  const config  = useRuntimeConfig()
  const apiUrl  = config.apiInternalUrl
  const BASE    = config.public.siteUrl
  const today   = new Date().toISOString().split('T')[0]

  const [productsRes, blogsRes, categoriesRes, pagesRes] = await Promise.all([
    $fetch<any>(`${apiUrl}/api/v1/products?limit=1000&fields=slug,updatedAt`).catch(() => null),
    $fetch<any>(`${apiUrl}/api/v1/blog?limit=1000&status=published&fields=slug,updatedAt`).catch(() => null),
    $fetch<any>(`${apiUrl}/api/v1/categories/tree`).catch(() => null),
    $fetch<any>(`${apiUrl}/api/v1/pages?status=published&fields=slug,updatedAt`).catch(() => null),
  ])

  function flattenTree(nodes: any[]): any[] {
    return nodes.flatMap(n => [n, ...flattenTree(n.children ?? [])])
  }

  // Backend wraps all responses in { success, statusCode, data }
  const productList  : any[] = productsRes?.data?.items    ?? productsRes?.data?.products ?? []
  const blogList     : any[] = blogsRes?.data?.posts       ?? blogsRes?.data?.items       ?? []
  const categoryList : any[] = Array.isArray(categoriesRes?.data) ? flattenTree(categoriesRes.data) : []
  const pageList     : any[] = Array.isArray(pagesRes?.data)      ? pagesRes.data         : []

  const staticPages = [
    { loc: BASE,               changefreq: 'daily',  priority: '1.0', lastmod: today },
    { loc: `${BASE}/products`, changefreq: 'daily',  priority: '0.9', lastmod: today },
    { loc: `${BASE}/blog`,     changefreq: 'weekly', priority: '0.7', lastmod: today },
  ]

  const productUrls = productList.map((p: any) => ({
    loc:        `${BASE}/product/${p.slug}`,
    changefreq: 'weekly',
    priority:   '0.8',
    lastmod:    p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : today,
  }))

  const blogUrls = blogList.map((b: any) => ({
    loc:        `${BASE}/blog/${b.slug}`,
    changefreq: 'monthly',
    priority:   '0.6',
    lastmod:    b.updatedAt ? new Date(b.updatedAt).toISOString().split('T')[0] : today,
  }))

  const categoryUrls = categoryList.map((c: any) => ({
    loc:        `${BASE}/category/${c.slug}`,
    changefreq: 'weekly',
    priority:   '0.7',
    lastmod:    c.updatedAt ? new Date(c.updatedAt).toISOString().split('T')[0] : today,
  }))

  const pageUrls = pageList.map((p: any) => ({
    loc:        `${BASE}/pages/${p.slug}`,
    changefreq: 'monthly',
    priority:   '0.5',
    lastmod:    p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : today,
  }))

  const allUrls = [...staticPages, ...productUrls, ...blogUrls, ...categoryUrls, ...pageUrls]

  const urlset = allUrls
    .map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`)
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return xml
})
