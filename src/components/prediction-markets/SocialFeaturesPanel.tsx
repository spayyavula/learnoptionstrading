import React, { useState } from 'react'
import { Trophy, TrendingUp, Users, MessageCircle, Eye, Copy, Bell, BellOff, Crown, Medal, Award } from 'lucide-react'

interface TopTrader {
  rank: number
  username: string
  avatar: string
  pnl: number
  pnlPercent: number
  winRate: number
  totalTrades: number
  specialization: string
  isFollowing: boolean
  isCopyTrading: boolean
  verified: boolean
}

interface CommunitySentiment {
  marketTicker: string
  newPositions: {
    yes: number
    no: number
  }
  commentSentiment: {
    bullishYes: number
    neutral: number
    bullishNo: number
  }
  trend: 'increasing_yes' | 'increasing_no' | 'neutral'
  smartMoneyFlow: {
    direction: 'yes' | 'no'
    change: number
  }
}

interface MarketDiscussion {
  id: string
  username: string
  avatar: string
  timestamp: Date
  position: 'yes' | 'no' | null
  content: string
  upvotes: number
  downvotes: number
  replies: number
  verified: boolean
}

interface SocialFeaturesPanelProps {
  marketTicker?: string
  onFollowTrader: (username: string) => void
  onCopyTrade: (username: string) => void
  onPostComment: (content: string, position: 'yes' | 'no' | null) => void
}

export const SocialFeaturesPanel: React.FC<SocialFeaturesPanelProps> = ({
  marketTicker,
  onFollowTrader,
  onCopyTrade,
  onPostComment
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'sentiment' | 'discussion'>('leaderboard')
  const [commentText, setCommentText] = useState('')
  const [commentPosition, setCommentPosition] = useState<'yes' | 'no' | null>(null)

  // Mock data - would come from API
  const topTraders: TopTrader[] = [
    {
      rank: 1,
      username: '@PredictionKing',
      avatar: '👑',
      pnl: 4820,
      pnlPercent: 42.5,
      winRate: 89,
      totalTrades: 156,
      specialization: 'Politics',
      isFollowing: false,
      isCopyTrading: false,
      verified: true
    },
    {
      rank: 2,
      username: '@MarketMaven',
      avatar: '🎯',
      pnl: 3105,
      pnlPercent: 38.2,
      winRate: 76,
      totalTrades: 203,
      specialization: 'All Categories',
      isFollowing: true,
      isCopyTrading: false,
      verified: true
    },
    {
      rank: 3,
      username: '@DataDriven',
      avatar: '📊',
      pnl: 2890,
      pnlPercent: 35.8,
      winRate: 82,
      totalTrades: 134,
      specialization: 'Economics',
      isFollowing: false,
      isCopyTrading: false,
      verified: true
    },
    {
      rank: 4,
      username: '@TrendSpotter',
      avatar: '🔮',
      pnl: 2450,
      pnlPercent: 32.1,
      winRate: 74,
      totalTrades: 189,
      specialization: 'Sports',
      isFollowing: false,
      isCopyTrading: false,
      verified: false
    },
    {
      rank: 5,
      username: '@QuickFlip',
      avatar: '⚡',
      pnl: 2180,
      pnlPercent: 28.9,
      winRate: 69,
      totalTrades: 287,
      specialization: 'Day Trading',
      isFollowing: true,
      isCopyTrading: true,
      verified: false
    }
  ]

  const yourRank = {
    rank: 42,
    change: -12, // positions moved
    pnl: 184.50,
    pnlPercent: 8.1
  }

  const communitySentiment: CommunitySentiment = {
    marketTicker: marketTicker || 'BIDEN-2024',
    newPositions: { yes: 68, no: 32 },
    commentSentiment: { bullishYes: 54, neutral: 28, bullishNo: 18 },
    trend: 'increasing_yes',
    smartMoneyFlow: { direction: 'yes', change: 5 }
  }

  const discussions: MarketDiscussion[] = [
    {
      id: '1',
      username: '@PoliticalJunkie',
      avatar: '🏛️',
      timestamp: new Date(Date.now() - 2 * 3600000),
      position: 'yes',
      content: 'Just went long YES at 42%. Historical precedent strongly favors announcement by this date. Biden announced in April 2019 for 2020 race, and early announcements have become the norm.',
      upvotes: 24,
      downvotes: 2,
      replies: 8,
      verified: true
    },
    {
      id: '2',
      username: '@SkepticalTrader',
      avatar: '🤔',
      timestamp: new Date(Date.now() - 1 * 3600000),
      position: 'no',
      content: 'Market is wrong here. Age concerns (he\'d be 86 at end of 2nd term) and polling numbers suggest he\'ll step aside. I\'m loading up on NO at these prices.',
      upvotes: 18,
      downvotes: 5,
      replies: 12,
      verified: false
    },
    {
      id: '3',
      username: '@DataDriven',
      avatar: '📊',
      timestamp: new Date(Date.now() - 30 * 60000),
      position: null,
      content: 'Interesting divergence: prediction markets at 42% YES while betting markets showing 55% YES. Someone is wrong. Worth investigating the arbitrage opportunity.',
      upvotes: 31,
      downvotes: 1,
      replies: 6,
      verified: true
    }
  ]

  const handlePostComment = () => {
    if (commentText.trim()) {
      onPostComment(commentText, commentPosition)
      setCommentText('')
      setCommentPosition(null)
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-900/30' }
    if (rank === 2) return { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-700/30' }
    if (rank === 3) return { icon: Medal, color: 'text-orange-400', bg: 'bg-orange-900/30' }
    return { icon: Award, color: 'text-blue-400', bg: 'bg-blue-900/30' }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'leaderboard'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-2" />
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('sentiment')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'sentiment'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Sentiment
        </button>
        <button
          onClick={() => setActiveTab('discussion')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'discussion'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <MessageCircle className="w-4 h-4 inline mr-2" />
          Discussion
        </button>
      </div>

      <div className="p-6">
        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            {/* Your Rank */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border-2 border-blue-300 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your Rank</div>
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      #{yourRank.rank}
                    </span>
                    <span className={`flex items-center text-sm font-semibold ${
                      yourRank.change < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      {yourRank.change < 0 ? '▼' : '▲'} {Math.abs(yourRank.change)} spots this week
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total P&L</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    +${yourRank.pnl.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    +{yourRank.pnlPercent}%
                  </div>
                </div>
              </div>
            </div>

            {/* Top Traders */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Top Traders This Week
              </h3>

              <div className="space-y-3">
                {topTraders.map(trader => {
                  const Badge = getRankBadge(trader.rank)

                  return (
                    <div
                      key={trader.username}
                      className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3 flex-1">
                          {/* Rank Badge */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${Badge.bg}`}>
                            <Badge.icon className={`w-5 h-5 ${Badge.color}`} />
                          </div>

                          {/* Trader Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {trader.rank}. {trader.username}
                              </span>
                              {trader.verified && (
                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              {trader.isCopyTrading && (
                                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-semibold">
                                  Auto-copying
                                </span>
                              )}
                            </div>

                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {trader.specialization} • {trader.winRate}% Win Rate
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs">Total P&L</div>
                                <div className="font-bold text-green-600 dark:text-green-400">
                                  +${trader.pnl.toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs">Return</div>
                                <div className="font-bold text-green-600 dark:text-green-400">
                                  +{trader.pnlPercent}%
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs">Trades</div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  {trader.totalTrades}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onFollowTrader(trader.username)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            trader.isFollowing
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {trader.isFollowing ? (
                            <>
                              <BellOff className="w-4 h-4 inline mr-1" />
                              Following
                            </>
                          ) : (
                            <>
                              <Bell className="w-4 h-4 inline mr-1" />
                              Follow
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => onCopyTrade(trader.username)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            trader.isCopyTrading
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <Copy className="w-4 h-4 inline mr-1" />
                          {trader.isCopyTrading ? 'Copying' : 'Copy Trade'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sentiment Tab */}
        {activeTab === 'sentiment' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Community Sentiment
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                What traders are doing on {communitySentiment.marketTicker}
              </p>
            </div>

            {/* New Positions */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                New Positions (Last 24h)
              </h4>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-green-600 dark:text-green-400 font-semibold">YES</span>
                    <span className="text-gray-900 dark:text-white font-bold">
                      {communitySentiment.newPositions.yes}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                      style={{ width: `${communitySentiment.newPositions.yes}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-red-600 dark:text-red-400 font-semibold">NO</span>
                    <span className="text-gray-900 dark:text-white font-bold">
                      {communitySentiment.newPositions.no}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                      style={{ width: `${communitySentiment.newPositions.no}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Trend: <span className="font-semibold text-green-600 dark:text-green-400">YES sentiment increasing</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Comment Sentiment */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Comment Sentiment
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Bullish YES</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${communitySentiment.commentSentiment.bullishYes}%` }}
                      />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white w-8 text-right">
                      {communitySentiment.commentSentiment.bullishYes}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Neutral</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-500"
                        style={{ width: `${communitySentiment.commentSentiment.neutral}%` }}
                      />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white w-8 text-right">
                      {communitySentiment.commentSentiment.neutral}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Bullish NO</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${communitySentiment.commentSentiment.bullishNo}%` }}
                      />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white w-8 text-right">
                      {communitySentiment.commentSentiment.bullishNo}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Money Flow */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <Eye className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                Smart Money Flow
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Tracking top 10% of traders by performance
              </p>
              <div className="flex items-center space-x-2">
                <span className={`text-2xl font-bold ${
                  communitySentiment.smartMoneyFlow.direction === 'yes'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {communitySentiment.smartMoneyFlow.direction === 'yes' ? '↗' : '↘'}
                </span>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Moving toward {communitySentiment.smartMoneyFlow.direction.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    +{communitySentiment.smartMoneyFlow.change}% in last 24h
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Discussion Tab */}
        {activeTab === 'discussion' && (
          <div className="space-y-4">
            {/* Comment Input */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your analysis or ask a question..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Your position:</span>
                  <button
                    onClick={() => setCommentPosition(commentPosition === 'yes' ? null : 'yes')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      commentPosition === 'yes'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    YES
                  </button>
                  <button
                    onClick={() => setCommentPosition(commentPosition === 'no' ? null : 'no')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      commentPosition === 'no'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    NO
                  </button>
                  <button
                    onClick={() => setCommentPosition(null)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      commentPosition === null
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Neutral
                  </button>
                </div>

                <button
                  onClick={handlePostComment}
                  disabled={!commentText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                >
                  Post
                </button>
              </div>
            </div>

            {/* Discussions */}
            <div className="space-y-3">
              {discussions.map(discussion => (
                <div
                  key={discussion.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {discussion.avatar}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {discussion.username}
                        </span>
                        {discussion.verified && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {discussion.position && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            discussion.position === 'yes'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {discussion.position.toUpperCase()}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {discussion.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {discussion.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <button className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                      <span>▲</span>
                      <span>{discussion.upvotes}</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      <span>▼</span>
                      <span>{discussion.downvotes}</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span>{discussion.replies} replies</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
