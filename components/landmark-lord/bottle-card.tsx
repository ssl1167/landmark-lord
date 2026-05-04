"use client"

import { useState, useEffect } from "react"
import { Heart, MessageSquare, Image as ImageIcon, User, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/components/landmark-lord/app-context"

interface Comment {
  id: string
  content: string
  author: string
  userId: string
  createdAt: string
}

interface BottleCardProps {
  id: string
  content: string
  author: string
  likes: number
  comments: number
  hasImage?: boolean
}

export function BottleCard({ id, content, author, likes: initialLikes, comments, hasImage }: BottleCardProps) {
  const { user, token } = useApp()
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(initialLikes)
  const [showComments, setShowComments] = useState(false)
  const [commentList, setCommentList] = useState<Comment[]>([])
  const [commentContent, setCommentContent] = useState("")
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  const handleLike = () => {
    if (liked) {
      setLikes(l => l - 1)
    } else {
      setLikes(l => l + 1)
    }
    setLiked(!liked)
  }

  // 获取评论列表
  useEffect(() => {
    if (showComments) {
      fetchComments()
    }
  }, [showComments, id])

  const fetchComments = async () => {
    setIsLoadingComments(true)
    try {
      const res = await fetch(`/api/bottles/${id}/comments`)
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          setCommentList(json.data)
        }
      }
    } catch (error) {
      console.error('获取评论失败:', error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  // 提交评论
  const handleSubmitComment = async () => {
    if (!user || !token || !commentContent.trim()) return

    setIsSubmittingComment(true)
    try {
      const res = await fetch(`/api/bottles/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: commentContent.trim()
        })
      })

      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          // 添加新评论到列表
          setCommentList(prev => [json.data, ...prev])
          // 清空输入
          setCommentContent('')
          // 刷新漂流瓶列表
          window.dispatchEvent(new CustomEvent('bottleUpdated'))
        }
      } else {
        const json = await res.json()
        alert(json.message || '评论失败')
      }
    } catch (error) {
      console.error('提交评论失败:', error)
      alert('评论失败，请稍后重试')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  return (
    <div className="bg-card border border-border/50 rounded-xl p-3 space-y-3 hover:border-purple/30 transition-colors">
      {/* Author */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-background" />
        </div>
        <span className="text-sm font-medium text-foreground">{author}</span>
      </div>

      {/* Content */}
      <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>

      {/* Image preview */}
      {hasImage && (
        <div className="relative h-24 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple/20 to-cyan/20" />
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1">
        <button 
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1.5 text-xs transition-colors",
            liked ? "text-pink-400" : "text-muted-foreground hover:text-pink-400"
          )}
        >
          <Heart className={cn("w-4 h-4", liked && "fill-current")} />
          <span>{likes}</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-cyan transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{comments}</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-border/50 pt-3 space-y-2">
          {/* Comment list */}
          <div className="text-xs space-y-2 max-h-40 overflow-y-auto">
            {isLoadingComments ? (
              <p className="text-center text-muted-foreground">加载中...</p>
            ) : commentList.length > 0 ? (
              commentList.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <span className={`font-medium ${comment.userId === user?.id ? 'text-purple' : 'text-cyan'}`}>
                    {comment.author}:
                  </span>
                  <span className="text-muted-foreground flex-1">{comment.content}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">暂无评论</p>
            )}
          </div>
          
          {/* Comment input */}
          {user && (
            <div className="flex gap-2">
              <input 
                type="text" 
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                placeholder="添加评论..."
                className="flex-1 px-3 py-1.5 bg-secondary border border-border/50 rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                disabled={isSubmittingComment}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentContent.trim() || isSubmittingComment}
                className="flex items-center justify-center w-8 h-8 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 text-muted-foreground hover:text-cyan" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
