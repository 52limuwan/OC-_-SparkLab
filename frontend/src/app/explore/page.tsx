'use client'

import Link from 'next/link'
import TopNavBar from '@/components/TopNavBar'
import StatusBar from '@/components/StatusBar'

export default function ExplorePage() {
  const courses = [
    {
      id: 1,
      title: 'Docker 基础入门',
      description: '学习 Docker 的基本概念、镜像管理和容器操作',
      difficulty: '入门',
      duration: '4小时',
      labs: 8,
      students: 1250,
      rating: 4.8,
      category: 'Docker',
      color: 'primary'
    },
    {
      id: 2,
      title: 'Docker 网络配置',
      description: '深入理解 Docker 网络模式、自定义网络和跨主机通信',
      difficulty: '中级',
      duration: '6小时',
      labs: 12,
      students: 890,
      rating: 4.7,
      category: 'Docker',
      color: 'secondary'
    },
    {
      id: 3,
      title: 'Docker Compose 实战',
      description: '使用 Docker Compose 编排多容器应用',
      difficulty: '中级',
      duration: '5小时',
      labs: 10,
      students: 756,
      rating: 4.9,
      category: 'Docker',
      color: 'tertiary'
    },
    {
      id: 4,
      title: 'Kubernetes 入门',
      description: '学习容器编排系统 Kubernetes 的核心概念',
      difficulty: '进阶',
      duration: '8小时',
      labs: 15,
      students: 623,
      rating: 4.6,
      category: 'Kubernetes',
      color: 'primary'
    },
    {
      id: 5,
      title: '容器安全最佳实践',
      description: '掌握容器安全加固、漏洞扫描和运行时保护',
      difficulty: '进阶',
      duration: '6小时',
      labs: 11,
      students: 445,
      rating: 4.8,
      category: '安全',
      color: 'error'
    },
    {
      id: 6,
      title: 'CI/CD 与容器化',
      description: '使用 Docker 构建持续集成和持续部署流水线',
      difficulty: '进阶',
      duration: '7小时',
      labs: 13,
      students: 534,
      rating: 4.7,
      category: 'DevOps',
      color: 'secondary'
    },
  ]

  const categories = ['全部', 'Docker', 'Kubernetes', '安全', 'DevOps']
  const difficulties = ['全部难度', '入门', '中级', '进阶']

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <TopNavBar />
      
      <main className="flex-1 mt-16 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">浏览实验课程</h1>
            <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">
              从基础到进阶，系统学习容器技术
            </p>
          </section>

          {/* Filters */}
          <section className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    cat === '全部'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <select className="bg-surface-container border-none rounded px-4 py-2 text-sm focus:ring-2 focus:ring-primary">
              {difficulties.map((diff) => (
                <option key={diff}>{diff}</option>
              ))}
            </select>
          </section>

          {/* Course Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-surface-container rounded-lg overflow-hidden border border-outline-variant/10 hover:border-primary/30 transition-all group"
              >
                <div className={`h-2 bg-${course.color}`}></div>
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">
                        {course.category}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        course.difficulty === '入门'
                          ? 'bg-secondary-container text-on-secondary'
                          : course.difficulty === '中级'
                          ? 'bg-primary-container text-on-primary'
                          : 'bg-tertiary-container text-on-tertiary'
                      }`}>
                        {course.difficulty}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant line-clamp-2">
                      {course.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-on-surface-variant font-mono">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">science</span>
                      {course.labs} 实验
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        <span className="font-bold">{course.rating}</span>
                      </div>
                      <div className="text-on-surface-variant">
                        {course.students} 学生
                      </div>
                    </div>
                    <Link
                      href={`/lab/${course.id}`}
                      className="px-4 py-2 bg-primary text-on-primary rounded text-sm font-bold hover:brightness-110 transition-all"
                    >
                      开始学习
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* CTA Section */}
          <section className="mt-16 bg-surface-container-low rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">找不到合适的课程？</h2>
            <p className="text-on-surface-variant mb-8 max-w-2xl mx-auto">
              我们持续更新课程内容。如果你有特定的学习需求，欢迎联系我们。
            </p>
            <div className="flex gap-4 justify-center">
              <button className="px-6 py-3 bg-primary text-on-primary rounded-lg font-bold hover:brightness-110 transition-all">
                提交课程建议
              </button>
              <Link
                href="/docs"
                className="px-6 py-3 border border-outline text-primary rounded-lg font-bold hover:bg-surface-container-high transition-all"
              >
                查看文档
              </Link>
            </div>
          </section>
        </div>
      </main>

      <StatusBar />
    </div>
  )
}
