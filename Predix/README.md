# Predix Markets

A decentralized prediction market platform built with Next.js, Web3, and AI-powered content aggregation.

## 🌟 Features

- **Multi-language Support**: English, Chinese, Japanese, Korean
- **Web3 Integration**: Wallet connection via RainbowKit
- **Responsive Design**: Desktop and mobile optimized
- **Real-time Data**: Live market updates and predictions
- **AI Content Aggregation**: Automatic market generation from news sources
- **Serverless Architecture**: Netlify deployment ready

## 🚀 Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **next-intl** for internationalization

### Web3
- **Wagmi** for Ethereum integration
- **RainbowKit** for wallet connections
- **Viem** for blockchain interactions

### Backend
- **Netlify Functions** (Serverless)
- **Content Crawling** with Cheerio & Puppeteer
- **AI-powered** market generation

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd predix-markets
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `out`
4. Configure environment variables
5. Deploy automatically on push to main branch

---

**Built with ❤️ by the Predix team**