import React from 'react'

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Aboutpage.css";


function Aboutpage() {


// About page interactions (no frameworks required)
(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealNodes = document.querySelectorAll('.reveal');

  // If user prefers reduced motion or IntersectionObserver not supported,
  // just show everything immediately.
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealNodes.forEach(n => n.classList.add('visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target); // reveal once
        }
      });
    },
    { threshold: 0.15 }
  );

  revealNodes.forEach(n => io.observe(n));

  // Optional: gentle header shadow on scroll
  const header = document.querySelector('.header');
  const applyShadow = () => {
    if (!header) return;
    header.style.boxShadow = window.scrollY > 4 ? '0 6px 24px rgba(0,0,0,.12)' : 'none';
  };
  window.addEventListener('scroll', applyShadow, { passive: true });
  applyShadow();
})();
  return (
   <div>
 <div class="section">
        <h2>About Pack Pal</h2>
        <p>At Pack Pal, we believe that every journey deserves the perfect companion. Founded on the principle that quality bags should combine functionality, durability, and style, we've dedicated ourselves to creating bags that don't just carry your belongings – they enhance your entire experience.</p>
        <p>Whether you're a daily commuter, weekend adventurer, or global traveler, Pack Pal is designed to be your reliable partner. We understand that your bag is more than just an accessory; it's an extension of your lifestyle, a keeper of your essentials, and a silent companion through life's adventures.</p>
      </div>

      
      <div class="section">
        <h2>Our Story</h2>
        <p>Every great brand has a story, and ours begins with a simple frustration and a big dream.</p>

        <div class="timeline">
          <article class="timeline-item">
            <div class="timeline-dot" aria-hidden="true"></div>
            <div class="timeline-content">
              <div class="timeline-year">The Beginning - 2020</div>
              <p>It all started when our founder, constantly traveling for work, grew tired of bags that promised durability but failed when it mattered most. After a particularly disastrous trip where a poorly made bag gave way at the airport, spilling important documents everywhere, the idea for Pack Pal was born.</p>
            </div>
          </article>

          <article class="timeline-item">
            <div class="timeline-dot" aria-hidden="true"></div>
            <div class="timeline-content">
              <div class="timeline-year">Research & Development - 2021</div>
              <p>We spent over a year researching materials, testing designs, and gathering feedback from travelers, students, and professionals. We visited factories, spoke with craftspeople, and learned everything we could about what makes a bag truly exceptional.</p>
            </div>
          </article>

          <article class="timeline-item">
            <div class="timeline-dot" aria-hidden="true"></div>
            <div class="timeline-content">
              <div class="timeline-year">First Collection - 2022</div>
              <p>After countless prototypes and rigorous testing, we launched our first collection. The response was overwhelming – customers loved the thoughtful design, premium materials, and attention to detail that went into every Pack Pal bag.</p>
            </div>
          </article>

          <article class="timeline-item">
            <div class="timeline-dot" aria-hidden="true"></div>
            <div class="timeline-content">
              <div class="timeline-year">Growing Community - 2023–2024</div>
              <p>What started as a small team with a big vision has grown into a community of bag enthusiasts, travelers, and everyday adventurers who trust Pack Pal to carry what matters most. We've expanded our collection while maintaining our commitment to quality and innovation.</p>
            </div>
          </article>

          <article class="timeline-item">
            <div class="timeline-dot" aria-hidden="true"></div>
            <div class="timeline-content">
              <div class="timeline-year">Today & Beyond</div>
              <p>Today, Pack Pal continues to evolve, always listening to our customers and pushing the boundaries of what a bag can be. We're not just making bags; we're crafting companions for life's journey, one stitch at a time.</p>
            </div>
          </article>
        </div>
      </div>

      
      <div class="section">
        <h2>Our Values</h2>
        <div class="values-grid">
          <div class="value-card">
            <div class="value-icon" aria-hidden="true">🎯</div>
            <h4>Quality First</h4>
            <p>We never compromise on materials or craftsmanship. Every Pack Pal bag is built to last, tested rigorously, and designed to exceed expectations.</p>
          </div>
          <div class="value-card">
            <div class="value-icon" aria-hidden="true">🌱</div>
            <h4>Sustainability</h4>
            <p>We're committed to responsible manufacturing practices and sustainable materials, ensuring our bags are good for you and the planet.</p>
          </div>
          <div class="value-card">
            <div class="value-icon" aria-hidden="true">💡</div>
            <h4>Innovation</h4>
            <p>We constantly seek new ways to improve functionality, comfort, and style, incorporating the latest technologies and design trends.</p>
          </div>
          <div class="value-card">
            <div class="value-icon" aria-hidden="true">🤝</div>
            <h4>Customer Focus</h4>
            <p>Your needs drive our design decisions. We listen, learn, and create bags that truly serve the people who use them every day.</p>
          </div>
        </div>
      </div>

      
      <div class="section">
        <h2>Our Mission</h2>
        <p>Our mission is simple yet profound: to create bags that seamlessly blend into your life, enhancing your experiences without ever holding you back. We strive to be the brand you think of when you need something reliable, stylish, and perfectly suited to your needs.</p>

        <h3>What Sets Us Apart</h3>
        <p>While many companies make bags, few make companions. Pack Pal bags are thoughtfully designed with real-world use in mind. From the placement of every pocket to the choice of every material, we consider how our products will perform in the hands of real people living real lives.</p>

        <p>We believe in the power of good design to improve daily experiences, and we're committed to continuous innovation while maintaining the timeless appeal that makes our bags as relevant today as they will be years from now.</p>
      </div>

      
      <div class="section">
        <h2>Meet Our Team</h2>
        <p>Behind every Pack Pal bag is a dedicated team of designers, craftspeople, and customer advocates who share our passion for excellence.</p>

        <div class="team-grid">
          <article class="team-member">
            <div class="team-avatar" aria-hidden="true">S</div>
            <h4>Sandya Marasinghe</h4>
            <p><strong>Founder</strong></p>
            <p>The visionary behind the bag business, the Founder establishes the company’s mission, values, and long-term strategy. They drive innovation, oversee overall operations, and ensure the brand stays aligned with customer needs and market trends. As the driving force of the business, the Founder provides leadership, inspires the team, and nurtures growth opportunities.</p>
          </article>

          <article class="team-member">
            <div class="team-avatar" aria-hidden="true">R</div>
            <h4>Ramya Darshi</h4>
            <p><strong>Head Of Design</strong></p>
            <p>The Head of Design leads the creative vision of the brand, overseeing the design and development of new bag collections. They focus on innovation, aesthetics, and functionality to ensure products meet customer expectations and market trends. By guiding the design team, they shape the brand’s identity and maintain a balance between style and practicality.</p>
          </article>
        </div>
      </div>

</div>

  )
}

export default Aboutpage
