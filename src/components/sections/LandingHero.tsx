import { useEffect, useState } from 'react';

interface LandingHeroProps {
  onStart: () => void;
}

export function LandingHero({ onStart }: LandingHeroProps) {
  const phrase = '走进业务流';
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    let timer = window.setTimeout(() => undefined, 0);

    const startTyping = (index: number) => {
      timer = window.setTimeout(() => {
        setTypedText(phrase.slice(0, index + 1));

        if (index < phrase.length - 1) {
          startTyping(index + 1);
          return;
        }

        timer = window.setTimeout(() => {
          setTypedText('');
          startTyping(0);
        }, 1800);
      }, index === 0 ? 500 : 120);
    };

    startTyping(0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <section className="hero-landing">
      <div className="hero-landing-bg" aria-hidden="true">
        <span className="hero-landing-glow" />
      </div>
      <div className="hero-landing-content">
        <p className="section-eyebrow">AI 原生组织架构师</p>
        <h1 className="hero-title" aria-label="让 AI 走进业务流。">
          <span className="hero-title-line">让 AI</span>
          <span className="hero-title-line hero-title-line-typed">
            <span className="hero-accent">{typedText || '\u00A0'}</span>
            <span className="hero-cursor" aria-hidden="true">
              |
            </span>
            。
          </span>
        </h1>
        <p className="hero-lead">
          把你们的业务流慢慢讲清楚，我们一起看哪些环节适合让 AI 协同，哪些已经可以被 AI 稳定接住。
        </p>
        <button className="primary-button hero-start-button" type="button" onClick={onStart}>
          开始诊断
        </button>
        <p className="hero-note">5 大行业 · 7 组真实案例 · 不用准备材料</p>
      </div>
    </section>
  );
}
