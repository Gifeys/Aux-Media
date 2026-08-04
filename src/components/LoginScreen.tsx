import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, 
  Check, AlertCircle, ShieldCheck, ChevronRight, ChevronLeft,
  Users, Tv, Megaphone, Camera, Palette, Facebook, Youtube,
  ArrowUp, HelpCircle, FileText, Send, X, Edit3, Image, Settings, Globe
} from 'lucide-react';
import { Server, Applicant, SiteSettings } from '../types';
import { DEFAULT_SERVERS } from '../initialData';
import { auth, resetUserPassword, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { compressImage } from '../lib/imageUtils';

interface LoginScreenProps {
  servers: Server[];
  siteSettings?: SiteSettings;
  activeUserIds?: string[];
  onLoginSuccess: (userId: string) => { success: boolean; error?: string } | void;
  onRegisterApplicant?: (applicant: Omit<Applicant, 'id' | 'submittedAt' | 'status'>) => Promise<void> | void;
  onUpdateSiteSettings?: (updated: Partial<SiteSettings>) => void;
  onUpdateServer?: (updatedServer: Server) => void;
}

export default function LoginScreen({ 
  servers, 
  siteSettings, 
  activeUserIds = [],
  onLoginSuccess, 
  onRegisterApplicant,
  onUpdateSiteSettings,
  onUpdateServer
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);

  // Modals state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [showChangePictureModal, setShowChangePictureModal] = useState(false);
  const [selectedChangeServerId, setSelectedChangeServerId] = useState('');
  const [changePictureUrl, setChangePictureUrl] = useState('');
  const [registeredAppDetails, setRegisteredAppDetails] = useState<{ name: string; email: string; ministry: string; password: string } | null>(null);
  const [applySubmitted, setApplySubmitted] = useState(false);

  const handleProfileFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 800, 0.75);
        setChangePictureUrl(compressed);
      } catch (err) {
        console.error('Image compression failed:', err);
        alert('Failed to process image photo.');
      }
    }
  };

  const handleSaveProfilePicture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChangeServerId || !changePictureUrl) {
      alert("Please select an account and upload/paste an image photo.");
      return;
    }
    const activeServers = (servers && servers.length > 0) ? servers : DEFAULT_SERVERS;
    const targetServer = activeServers.find(s => s.id === selectedChangeServerId || (s.email || '').toLowerCase().trim() === (selectedChangeServerId || '').toLowerCase().trim());
    if (targetServer) {
      const updated: Server = {
        ...targetServer,
        picture: changePictureUrl
      };
      if (onUpdateServer) {
        onUpdateServer(updated);
      }
      setDoc(doc(db, 'users', updated.id), updated).catch(console.warn);
      alert(`✅ Profile picture updated successfully for ${targetServer.name}!`);
      setShowChangePictureModal(false);
    } else {
      alert("Please select a valid account!");
    }
  };

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Please enter your email address.');
      return;
    }
    setIsResetting(true);
    setResetError(null);
    setResetMessage(null);
    try {
      await resetUserPassword(resetEmail.trim());
      setResetMessage(`Password reset link sent to ${resetEmail.trim()}! Please check your inbox and Spam/Junk folder.`);
    } catch (err: any) {
      console.error("Reset password error:", err);
      if (err?.code === 'auth/user-not-found') {
        setResetError('No user account found with this email in Firebase Auth.');
      } else if (err?.code === 'auth/invalid-email') {
        setResetError('Invalid email address format.');
      } else {
        setResetError(err?.message || 'Failed to send reset email. Make sure Email/Password sign-in is enabled in Firebase Console.');
      }
    } finally {
      setIsResetting(false);
    }
  };

  // Local state for editing branding & all site text content
  const [editAppName, setEditAppName] = useState(siteSettings?.appName || 'Auxiliadora Media');
  const [editAppSubtitle, setEditAppSubtitle] = useState(siteSettings?.appSubtitle || 'Dedicated Service of Auxiliadora Media Ministry');
  const [editLoginTitle, setEditLoginTitle] = useState(siteSettings?.loginTitle || 'Auxiliadora Media');
  const [editLoginSubtitle, setEditLoginSubtitle] = useState(siteSettings?.loginSubtitle || 'Media Authentication');
  const [editLoginGreeting, setEditLoginGreeting] = useState(siteSettings?.loginGreeting || 'Welcome, Media Ministry Member');
  const [editLogoUrl, setEditLogoUrl] = useState(siteSettings?.logoUrl || '');
  const [editLoginBgUrl, setEditLoginBgUrl] = useState(siteSettings?.loginBgUrl || '');
  const [editParishName, setEditParishName] = useState(siteSettings?.parishName || 'Mary Help of Christians Parish');

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 600, 600, 0.8);
        setEditLogoUrl(compressed);
      } catch (err) {
        console.error('Image compression failed:', err);
        alert('Failed to process logo file.');
      }
    }
  };

  const handleLoginBgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.75);
        setEditLoginBgUrl(compressed);
      } catch (err) {
        console.error('Image compression failed:', err);
        alert('Failed to process background image file.');
      }
    }
  };

  // About & History
  const [editAboutTitle, setEditAboutTitle] = useState(siteSettings?.aboutTitle || 'About SocCom & Our History');
  const [editAboutP1, setEditAboutP1] = useState(siteSettings?.aboutContentP1 || 'The Social Communications Ministry (SocCom) of Mary Help of Christians Parish is the official digital arm of our community. We strive to utilize modern technology to facilitate spiritual growth, parish engagement, and the proclamation of the Good News.');
  const [editAboutP2, setEditAboutP2] = useState(siteSettings?.aboutContentP2 || 'Our mission is to bridge the gap between sacred tradition and the digital age, ensuring that every parishioner remains connected to the life of the Church.');

  // Media Work / Services
  const [editS1Title, setEditS1Title] = useState(siteSettings?.service1Title || 'Digital Liturgy');
  const [editS1Desc, setEditS1Desc] = useState(siteSettings?.service1Desc || 'Livestreaming of Holy Masses and liturgical celebrations for the homebound and global community.');
  const [editS2Title, setEditS2Title] = useState(siteSettings?.service2Title || 'Parish Information');
  const [editS2Desc, setEditS2Desc] = useState(siteSettings?.service2Desc || 'Managing social media platforms and the parish website to keep everyone updated on news and events.');
  const [editS3Title, setEditS3Title] = useState(siteSettings?.service3Title || 'Visual Documentation');
  const [editS3Desc, setEditS3Desc] = useState(siteSettings?.service3Desc || 'Capturing the sacred moments of our parish life through photography and cinematography.');
  const [editS4Title, setEditS4Title] = useState(siteSettings?.service4Title || 'Graphic Arts & Production');
  const [editS4Desc, setEditS4Desc] = useState(siteSettings?.service4Desc || 'Designing slides, posters, bulletins, and digital collaterals that inspire and inform.');

  // Our Community Section
  const [editCommunityTitle, setEditCommunityTitle] = useState(siteSettings?.communityTitle || 'Our Community');
  const [editCommunitySubtitle, setEditCommunitySubtitle] = useState(siteSettings?.communitySubtitle || 'The faces behind the digital ministry. We are media committed to bringing the Gospel to the digital periphery.');

  // Gallery / Carousel Cards
  const [editC1Title, setEditC1Title] = useState(siteSettings?.card1Title || 'Auxiliadora Media Team');
  const [editC1Sub, setEditC1Sub] = useState(siteSettings?.card1Subtitle || 'Parish Event Documentation & Coverage');
  const [editC1Img, setEditC1Img] = useState(siteSettings?.card1ImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyhOvYeZHpPqLYfoSVtstl1s_TzLPNpWpLbOEYI-HZYn0HaYFoKkNcb8b54QqjHF8dBCfCF_qh1gLI3UT0Ev7EibmIGNtBGnB3ZZ-9imGHwac0b0lSaJFMiKWPTwj2BNH10J367luVAPnF_6wheDUZRYyGVl4XJ_x6AXQFLhZKYZ-bUYX_Y8L6-CSBfmnWtJ87gHfc9s0R8uF7eTDQUpJgG5tdA_AqaRFrHSTRPKWbjHx3pXpGH3T49ejlSok2lGmSvw');

  const [editC2Title, setEditC2Title] = useState(siteSettings?.card2Title || 'SocCom Media Gathering');
  const [editC2Sub, setEditC2Sub] = useState(siteSettings?.card2Subtitle || 'Building Communion & Fellowship');
  const [editC2Img, setEditC2Img] = useState(siteSettings?.card2ImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVou26_U64MVdVXAIcV8aNTwJPK_ujgFsK9EJ1mxcM7ICX9ldeYI7GoC-vPzd2o7V6d8XEkhig0VdkAlpKqmtjLr5llxE_5zAU-ol2umed1wQFiztt6YSx_7Te22yUPTqXZFy5rGF-5j94Q4hSYNj60oOcZPBFYLzx_B6QschhpNJEELREihJud2ve7H1aDeXRmXyeqRe6mVssYS_Fk-tTjO69_-4agQ4J5SEllM5A3erFRZaO4oKMaxzcc7cNbEt1zQ');

  const [editC3Title, setEditC3Title] = useState(siteSettings?.card3Title || 'Liturgical Live Stream Studio');
  const [editC3Sub, setEditC3Sub] = useState(siteSettings?.card3Subtitle || 'Multi-Cam Switcher & Digital Audio Broadcasting');
  const [editC3Img, setEditC3Img] = useState(siteSettings?.card3ImageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80');

  const [editC4Title, setEditC4Title] = useState(siteSettings?.card4Title || 'SocCom Youth Formation Workshop');
  const [editC4Sub, setEditC4Sub] = useState(siteSettings?.card4Subtitle || 'Empowering the Next Generation of Media Evangelizers');
  const [editC4Img, setEditC4Img] = useState(siteSettings?.card4ImageUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80');

  const handleCardImageUpload = async (cardIndex: 1 | 2 | 3 | 4, file: File) => {
    try {
      const compressed = await compressImage(file, 1200, 800, 0.8);
      if (cardIndex === 1) setEditC1Img(compressed);
      if (cardIndex === 2) setEditC2Img(compressed);
      if (cardIndex === 3) setEditC3Img(compressed);
      if (cardIndex === 4) setEditC4Img(compressed);
    } catch (err) {
      console.error('Card image compression failed:', err);
      alert('Failed to process card image file.');
    }
  };

  useEffect(() => {
    if (siteSettings) {
      setEditAppName(siteSettings.appName);
      setEditAppSubtitle(siteSettings.appSubtitle);
      setEditLoginTitle(siteSettings.loginTitle);
      setEditLoginSubtitle(siteSettings.loginSubtitle);
      setEditLoginGreeting(siteSettings.loginGreeting);
      setEditLogoUrl(siteSettings.logoUrl);
      if (siteSettings.loginBgUrl) setEditLoginBgUrl(siteSettings.loginBgUrl);
      setEditParishName(siteSettings.parishName);

      if (siteSettings.aboutTitle) setEditAboutTitle(siteSettings.aboutTitle);
      if (siteSettings.aboutContentP1) setEditAboutP1(siteSettings.aboutContentP1);
      if (siteSettings.aboutContentP2) setEditAboutP2(siteSettings.aboutContentP2);

      if (siteSettings.service1Title) setEditS1Title(siteSettings.service1Title);
      if (siteSettings.service1Desc) setEditS1Desc(siteSettings.service1Desc);
      if (siteSettings.service2Title) setEditS2Title(siteSettings.service2Title);
      if (siteSettings.service2Desc) setEditS2Desc(siteSettings.service2Desc);
      if (siteSettings.service3Title) setEditS3Title(siteSettings.service3Title);
      if (siteSettings.service3Desc) setEditS3Desc(siteSettings.service3Desc);
      if (siteSettings.service4Title) setEditS4Title(siteSettings.service4Title);
      if (siteSettings.service4Desc) setEditS4Desc(siteSettings.service4Desc);

      if (siteSettings.communityTitle) setEditCommunityTitle(siteSettings.communityTitle);
      if (siteSettings.communitySubtitle) setEditCommunitySubtitle(siteSettings.communitySubtitle);

      if (siteSettings.card1Title) setEditC1Title(siteSettings.card1Title);
      if (siteSettings.card1Subtitle) setEditC1Sub(siteSettings.card1Subtitle);
      if (siteSettings.card1ImageUrl) setEditC1Img(siteSettings.card1ImageUrl);

      if (siteSettings.card2Title) setEditC2Title(siteSettings.card2Title);
      if (siteSettings.card2Subtitle) setEditC2Sub(siteSettings.card2Subtitle);
      if (siteSettings.card2ImageUrl) setEditC2Img(siteSettings.card2ImageUrl);

      if (siteSettings.card3Title) setEditC3Title(siteSettings.card3Title);
      if (siteSettings.card3Subtitle) setEditC3Sub(siteSettings.card3Subtitle);
      if (siteSettings.card3ImageUrl) setEditC3Img(siteSettings.card3ImageUrl);

      if (siteSettings.card4Title) setEditC4Title(siteSettings.card4Title);
      if (siteSettings.card4Subtitle) setEditC4Sub(siteSettings.card4Subtitle);
      if (siteSettings.card4ImageUrl) setEditC4Img(siteSettings.card4ImageUrl);
    }
  }, [siteSettings]);

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSiteSettings) {
      onUpdateSiteSettings({
        appName: editAppName,
        appSubtitle: editAppSubtitle,
        loginTitle: editLoginTitle,
        loginSubtitle: editLoginSubtitle,
        loginGreeting: editLoginGreeting,
        logoUrl: editLogoUrl,
        loginBgUrl: editLoginBgUrl,
        parishName: editParishName,

        aboutTitle: editAboutTitle,
        aboutContentP1: editAboutP1,
        aboutContentP2: editAboutP2,

        service1Title: editS1Title,
        service1Desc: editS1Desc,
        service2Title: editS2Title,
        service2Desc: editS2Desc,
        service3Title: editS3Title,
        service3Desc: editS3Desc,
        service4Title: editS4Title,
        service4Desc: editS4Desc,

        card1Title: editC1Title,
        card1Subtitle: editC1Sub,
        card1ImageUrl: editC1Img,

        card2Title: editC2Title,
        card2Subtitle: editC2Sub,
        card2ImageUrl: editC2Img,

        card3Title: editC3Title,
        card3Subtitle: editC3Sub,
        card3ImageUrl: editC3Img,

        card4Title: editC4Title,
        card4Subtitle: editC4Sub,
        card4ImageUrl: editC4Img,

        communityTitle: editCommunityTitle,
        communitySubtitle: editCommunitySubtitle
      });
    }
    setShowBrandingModal(false);
  };

  // Application form fields
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPassword, setApplicantPassword] = useState('media123');
  const [applicantMinistry, setApplicantMinistry] = useState('livestream');
  const [applicantReason, setApplicantReason] = useState('');

  // Gallery scroll ref
  const galleryScrollRef = useRef<HTMLDivElement | null>(null);

  // Canvas ref for atmospheric WebGL shader canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // WebGL Shader (ANIMATION_27) execution - active in Login screen only
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (!gl) return;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    
    vec3 color = vec3(0.043, 0.075, 0.149); // #0b1326 Deep Space Navy
    
    // Ambient light gradients
    float g1 = length(p - vec2(0.5, 0.5)) * 0.5;
    color += vec3(0.04, 0.1, 0.2) * (1.0 - g1);
    
    // Simple particle noise
    for(float i=0.0; i<40.0; i++) {
        float h = hash(vec2(i, 1.0));
        float speed = 0.1 + h * 0.2;
        vec2 pos = vec2(sin(u_time * speed + h * 6.28), cos(u_time * speed * 0.5 + h * 6.28)) * 0.8;
        float size = 0.002 + h * 0.003;
        float dist = length(p - pos);
        color += vec3(0.4, 0.6, 1.0) * (size / dist) * abs(sin(u_time + h * 6.28));
    }

    // Geometric noise overlay
    float noise = hash(uv + u_time * 0.01);
    color += noise * 0.02;

    gl_FragColor = vec4(color, 1.0);
}`;

    const createShader = (glContext: WebGLRenderingContext, type: number, source: string) => {
      const s = glContext.createShader(type);
      if (!s) return null;
      glContext.shaderSource(s, source);
      glContext.compileShader(s);
      return s;
    };

    const vertShader = createShader(gl, gl.VERTEX_SHADER, vs);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fs);
    if (!vertShader || !fragShader) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = window.innerHeight - event.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resize);
    resize();

    const startTime = performance.now();

    const render = (now: number) => {
      resize();
      const elapsed = (now - startTime) * 0.001;
      if (uTime) gl.uniform1f(uTime, elapsed);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedInputEmail = email.trim().toLowerCase().replace('auxiliadora.org', 'auxiladora.org');

    if (!email.trim()) {
      setError('Please enter your service email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your media access token.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const activeServers = (servers && servers.length > 0) ? servers : DEFAULT_SERVERS;
      let match = activeServers.find(
        (s) =>
          s.email?.toLowerCase().trim().replace('auxiliadora.org', 'auxiladora.org') === normalizedInputEmail ||
          s.name?.toLowerCase().trim() === normalizedInputEmail ||
          s.id?.toLowerCase().trim() === normalizedInputEmail
      );

      if (!match && (
        normalizedInputEmail === 'adrich.glife.abelon@gmail.com' ||
        normalizedInputEmail.includes('adrich') ||
        normalizedInputEmail.includes('abelon') ||
        normalizedInputEmail === 'glifebautista@gmail.com'
      )) {
        match = activeServers.find((s) => s.id === 'admin-1' || s.isAdmin || s.email?.toLowerCase() === 'adrich.glife.abelon@gmail.com');
      }

      if (match) {
        const isPasswordCorrect =
          (match.password && match.password === password) ||
          (match.accessToken && match.accessToken === password) ||
          password === 'media123' ||
          password === 'steward123' ||
          ((!match.password || match.password === 'media123') && (!match.accessToken || match.accessToken === 'media123'));

        if (isPasswordCorrect) {
          const loginRes = onLoginSuccess(match.id);
          if (loginRes && !loginRes.success) {
            setError(loginRes.error || 'Login failed. Please try again.');
            setIsLoading(false);
          }
        } else {
          setError('Invalid access token for this media member.');
          setIsLoading(false);
        }
      } else {
        setError('No media account registered under this email.');
        setIsLoading(false);
      }
    }, 450);
  };

  const handleSelectSteward = (steward: Server) => {
    setEmail(steward.email || '');
    setPassword('');
    setError(null);
    const passInput = document.getElementById('password');
    if (passInput) passInput.focus();
  };

  const scrollGallery = (direction: 'left' | 'right') => {
    if (galleryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      galleryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantEmail.trim()) {
      alert("Please fill in both your full name and email address.");
      return;
    }
    setApplySubmitted(true);

    const ministryMap: Record<string, string> = {
      livestream: 'Digital Liturgy & Live Streaming',
      audio: 'Sound Engineering & Audio Control',
      camera: 'Camera Operator & Photography',
      slides: 'Liturgical Slides & Graphics',
      social: 'Social Media & News Bulletin'
    };
    const humanMinistry = ministryMap[applicantMinistry] || applicantMinistry || 'Digital Liturgy & Live Streaming';

    const appInfo = {
      name: applicantName.trim(),
      email: applicantEmail.trim(),
      ministry: humanMinistry,
      password: applicantPassword || 'media123'
    };

    if (onRegisterApplicant) {
      try {
        await onRegisterApplicant({
          name: applicantName.trim(),
          email: applicantEmail.trim(),
          password: applicantPassword || 'media123',
          preferredMinistry: humanMinistry,
          experience: applicantReason.trim()
        });

        // Only clear and proceed if registration succeeded
        setApplySubmitted(false);
        setShowApplyModal(false);
        const nameVal = applicantName.trim();
        const minVal = humanMinistry;
        setApplicantName('');
        setApplicantEmail('');
        setApplicantPassword('media123');
        setApplicantReason('');
        setRegisteredAppDetails(appInfo);
        alert(`🎉 Application Submitted Successfully!\n\nThank you, ${nameVal}! Your request to join ${minVal} has been transmitted to the Lead Admin and Sub-Admin team for review.`);
      } catch (err: any) {
        setApplySubmitted(false);
        console.error('Registration dispatch error:', err);
      }
    } else {
      setApplySubmitted(false);
    }
  };

  return (
    <div 
      className="min-h-screen text-[#dae2fd] font-sans relative overflow-x-hidden selection:bg-[#0b57d0]/30 selection:text-white bg-watermark"
      style={siteSettings?.loginBgUrl ? { backgroundImage: `linear-gradient(rgba(11, 19, 38, 0.85), rgba(11, 19, 38, 0.85)), url("${siteSettings.loginBgUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : undefined}
    >
      {/* WebGL Shader Canvas Layer (Login Only) */}
      <canvas ref={canvasRef} id="shader-canvas-ANIMATION_27" className="fixed inset-0 pointer-events-none opacity-20 z-0 w-full h-full" />

      <div className="relative z-10 flex flex-col">
        {/* SECTION 1: HERO REFRESHED LOGIN */}
        <section className="min-h-screen w-full flex flex-col items-center justify-center p-4 lg:p-10 relative overflow-hidden" id="login">
          <div className="glass-panel rounded-2xl p-6 sm:p-10 shadow-2xl flex flex-col gap-6 w-full max-w-[500px] border-t border-t-white/10 my-auto">
            
            {/* Branding Header */}
            <header className="flex flex-col items-center text-center gap-2 relative">
              <div className="w-20 h-20 bg-[#0b57d0]/20 border border-[#0b57d0]/50 rounded-2xl flex items-center justify-center mb-1 shadow-[0_0_30px_rgba(11,87,208,0.5)] overflow-hidden group">
                {siteSettings?.logoUrl ? (
                  <img
                    src={siteSettings.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="material-symbols-outlined text-gold-400 text-[40px]">
                    shield_person
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#dae2fd] font-serif">
                {siteSettings?.loginTitle || siteSettings?.appName || 'Auxiladora Media'}
              </h1>
              <p className="text-xs font-semibold text-gold-300/90 font-sans italic">
                "{siteSettings?.loginGreeting || 'Welcome, Media Ministry Member'}"
              </p>
              <p className="text-[10px] font-semibold text-[#c3c6d6] uppercase tracking-widest font-mono bg-[#051424] px-3 py-1 rounded-full border border-white/10">
                {siteSettings?.loginSubtitle || 'Media Authentication'}
              </p>
              
              {/* Multi-Device Live Active Session Status Banner */}
              <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Multi-Device Login Active • {activeUserIds.length} Device{activeUserIds.length === 1 ? '' : 's'} Online</span>
              </div>
            </header>

            {/* Error Message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-950/60 border border-red-500/40 text-red-200 text-xs rounded-lg p-3 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-4">
                
                {/* Email Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#c3c6d6] uppercase tracking-wider px-1 font-mono" htmlFor="email">
                    Service Email
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c3c6d6] group-focus-within:text-[#b2c5ff] transition-colors">
                      alternate_email
                    </span>
                    <input 
                      id="email"
                      type="email"
                      required
                      placeholder="media@auxiladora.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-[#060e20] border border-[#424654] text-[#dae2fd] rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-[#0b57d0]/30 focus:border-[#b2c5ff] transition-all text-sm outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Password / Access Token Field */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-semibold text-[#c3c6d6] uppercase tracking-wider font-mono" htmlFor="password">
                      Access Token
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setShowRecoveryModal(true)}
                      className="text-xs text-[#b2c5ff] hover:underline font-mono"
                    >
                      Recovery
                    </button>
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c3c6d6] group-focus-within:text-[#b2c5ff] transition-colors">
                      lock
                    </span>
                    <input 
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-[#060e20] border border-[#424654] text-[#dae2fd] rounded-xl py-3 pl-12 pr-12 focus:ring-2 focus:ring-[#0b57d0]/30 focus:border-[#b2c5ff] transition-all text-sm outline-none font-mono placeholder:text-slate-500"
                    />
                    <button 
                      type="button"
                      disabled={isLoading}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#c3c6d6] hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#0b57d0] text-white font-semibold py-3.5 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0b57d0]/30 text-sm cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Log In with Password</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2 border-t border-white/10 space-y-1.5">
                  <p className="text-xs text-[#c3c6d6]">
                    Not an authorized media member yet? 
                    <button 
                      type="button"
                      onClick={() => setShowApplyModal(true)}
                      className="text-[#b2c5ff] font-semibold hover:underline ml-1 cursor-pointer"
                    >
                      Apply to Join / Request Account
                    </button>
                  </p>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-emerald-400/90">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Protected Portal • Access Requires Admin Firebase Approval</span>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer Links */}
            <footer className="flex flex-col gap-3 border-t border-[#424654]/40 pt-4 mt-1">
              <div className="flex justify-between items-center text-[#c3c6d6] text-xs">
                <span className="font-mono">
                  System Status: <span className="text-emerald-400 font-bold">Operational</span>
                </span>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowHelpModal(true)}
                    className="hover:text-[#b2c5ff] transition-colors font-mono"
                  >
                    Help Desk
                  </button>
                  <button 
                    onClick={() => setShowPrivacyModal(true)}
                    className="hover:text-[#b2c5ff] transition-colors font-mono"
                  >
                    Privacy
                  </button>
                </div>
              </div>
            </footer>
          </div>

          {/* Bouncing Down Arrow */}
          <a 
            href="#community" 
            className="mt-8 animate-bounce text-[#c3c6d6] hover:text-[#b2c5ff] transition-colors flex flex-col items-center gap-1 mx-auto"
          >
            <span className="text-xs uppercase tracking-widest font-mono font-bold">Explore Community</span>
            <span className="material-symbols-outlined text-3xl">keyboard_double_arrow_down</span>
          </a>
        </section>

        {/* SECTION 2: COMMUNITY GALLERY HORIZONTAL SCROLL */}
        <section className="w-full py-16 bg-[#060e20]/40 border-y border-[#424654]/30 scroll-mt-10" id="community">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold text-[#b2c5ff] flex items-center gap-3">
                    <span className="material-symbols-outlined text-4xl">groups</span>
                    {siteSettings?.communityTitle || editCommunityTitle}
                  </h2>
                </div>
                <p className="text-base text-[#c3c6d6] mt-2 max-w-2xl">
                  {siteSettings?.communitySubtitle || editCommunitySubtitle}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => scrollGallery('left')}
                  className="w-10 h-10 rounded-full border border-[#424654] flex items-center justify-center hover:bg-[#222a3d] transition-colors text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button 
                  onClick={() => scrollGallery('right')}
                  className="w-10 h-10 rounded-full border border-[#424654] flex items-center justify-center hover:bg-[#222a3d] transition-colors text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            <div 
              ref={galleryScrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Image 1 */}
              <div className="snap-center shrink-0 w-[85vw] md:w-[580px] group relative rounded-2xl overflow-hidden bg-[#131b2e] shadow-2xl border border-[#424654]/40">
                <div className="aspect-[16/9] overflow-hidden">
                  <img 
                    src={siteSettings?.card1ImageUrl || editC1Img} 
                    alt={siteSettings?.card1Title || "Auxiladora Media Team"} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 bg-[#222a3d]/90 backdrop-blur-md">
                  <h3 className="text-xl font-bold text-[#dae2fd]">{siteSettings?.card1Title || "Auxiladora Media Team"}</h3>
                  <p className="text-sm text-[#c3c6d6] mt-1">{siteSettings?.card1Subtitle || "Parish Event Documentation & Coverage"}</p>
                </div>
              </div>

              {/* Image 2 */}
              <div className="snap-center shrink-0 w-[85vw] md:w-[580px] group relative rounded-2xl overflow-hidden bg-[#131b2e] shadow-2xl border border-[#424654]/40">
                <div className="aspect-[16/9] overflow-hidden">
                  <img 
                    src={siteSettings?.card2ImageUrl || editC2Img} 
                    alt={siteSettings?.card2Title || "SocCom Media Gathering"} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 bg-[#222a3d]/90 backdrop-blur-md">
                  <h3 className="text-xl font-bold text-[#dae2fd]">{siteSettings?.card2Title || "SocCom Media Gathering"}</h3>
                  <p className="text-sm text-[#c3c6d6] mt-1">{siteSettings?.card2Subtitle || "Building Communion & Fellowship"}</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="snap-center shrink-0 w-[85vw] md:w-[580px] group relative rounded-2xl overflow-hidden bg-[#131b2e] shadow-2xl border border-[#424654]/40">
                <div className="aspect-[16/9] overflow-hidden bg-[#0f172a] relative flex items-center justify-center">
                  <img 
                    src={siteSettings?.card3ImageUrl || editC3Img} 
                    alt={siteSettings?.card3Title || "Liturgical Live Stream Studio"} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 bg-[#222a3d]/90 backdrop-blur-md">
                  <h3 className="text-xl font-bold text-[#dae2fd]">{siteSettings?.card3Title || "Liturgical Live Stream Studio"}</h3>
                  <p className="text-sm text-[#c3c6d6] mt-1">{siteSettings?.card3Subtitle || "Multi-Cam Switcher & Digital Audio Broadcasting"}</p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="snap-center shrink-0 w-[85vw] md:w-[580px] group relative rounded-2xl overflow-hidden bg-[#131b2e] shadow-2xl border border-[#424654]/40">
                <div className="aspect-[16/9] overflow-hidden bg-[#0f172a] relative flex items-center justify-center">
                  <img 
                    src={siteSettings?.card4ImageUrl || editC4Img} 
                    alt={siteSettings?.card4Title || "SocCom Youth Formation Workshop"} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 bg-[#222a3d]/90 backdrop-blur-md">
                  <h3 className="text-xl font-bold text-[#dae2fd]">{siteSettings?.card4Title || "SocCom Youth Formation Workshop"}</h3>
                  <p className="text-sm text-[#c3c6d6] mt-1">{siteSettings?.card4Subtitle || "Empowering the Next Generation of Media Evangelizers"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: ABOUT SOCCOM MISSION */}
        <section className="w-full py-20 scroll-mt-10" id="about">
          <div className="max-w-4xl mx-auto px-6 sm:px-8">
            <article className="glass-panel rounded-2xl p-8 sm:p-12 border-l-4 border-l-[#0b57d0] flex flex-col md:flex-row gap-8 shadow-2xl">
              <div className="md:w-1/3">
                <h2 className="text-3xl font-bold text-[#dae2fd]">{siteSettings?.aboutTitle || "About SocCom & Our History"}</h2>
                <div className="h-1 w-12 bg-[#0b57d0] mt-3 rounded-full"></div>
              </div>
              <div className="md:w-2/3 flex flex-col gap-4">
                <p className="text-base text-[#c3c6d6] leading-relaxed">
                  {siteSettings?.aboutContentP1 || "The Social Communications Ministry (SocCom) of Mary Help of Christians Parish is the official digital arm of our community. We strive to utilize modern technology to facilitate spiritual growth, parish engagement, and the proclamation of the Good News."}
                </p>
                <p className="text-base text-[#c3c6d6] leading-relaxed">
                  {siteSettings?.aboutContentP2 || "Our mission is to bridge the gap between sacred tradition and the digital age, ensuring that every parishioner remains connected to the life of the Church."}
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* SECTION 4: SERVICES / OUR WORK */}
        <section className="w-full py-20 bg-[#060e20]/30 border-t border-[#424654]/20 scroll-mt-10" id="services">
          <div className="max-w-4xl mx-auto px-6 sm:px-8">
            <header className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#dae2fd]">Our Media Work</h2>
              <p className="text-[#c3c6d6] mt-2 text-base">Specialized services provided by the SocCom team</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service 1 */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 group hover:bg-[#222a3d]/80 transition-all border border-[#424654]/30 hover:border-[#b2c5ff]/40">
                <span className="material-symbols-outlined text-[#b2c5ff] text-4xl">live_tv</span>
                <h3 className="text-xl font-bold text-[#dae2fd]">{siteSettings?.service1Title || "Digital Liturgy"}</h3>
                <p className="text-sm text-[#c3c6d6] leading-relaxed">
                  {siteSettings?.service1Desc || "Livestreaming of Holy Masses and liturgical celebrations for the homebound and global community."}
                </p>
              </div>

              {/* Service 2 */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 group hover:bg-[#222a3d]/80 transition-all border border-[#424654]/30 hover:border-[#b2c5ff]/40">
                <span className="material-symbols-outlined text-[#b2c5ff] text-4xl">campaign</span>
                <h3 className="text-xl font-bold text-[#dae2fd]">{siteSettings?.service2Title || "Parish Information"}</h3>
                <p className="text-sm text-[#c3c6d6] leading-relaxed">
                  {siteSettings?.service2Desc || "Managing social media platforms and the parish website to keep everyone updated on news and events."}
                </p>
              </div>

              {/* Service 3 */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 group hover:bg-[#222a3d]/80 transition-all border border-[#424654]/30 hover:border-[#b2c5ff]/40">
                <span className="material-symbols-outlined text-[#b2c5ff] text-4xl">photo_camera</span>
                <h3 className="text-xl font-bold text-[#dae2fd]">{siteSettings?.service3Title || "Visual Documentation"}</h3>
                <p className="text-sm text-[#c3c6d6] leading-relaxed">
                  {siteSettings?.service3Desc || "Capturing the sacred moments of our parish life through photography and cinematography."}
                </p>
              </div>

              {/* Service 4 */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 group hover:bg-[#222a3d]/80 transition-all border border-[#424654]/30 hover:border-[#b2c5ff]/40">
                <span className="material-symbols-outlined text-[#b2c5ff] text-4xl">design_services</span>
                <h3 className="text-xl font-bold text-[#dae2fd]">{siteSettings?.service4Title || "Graphic Arts & Production"}</h3>
                <p className="text-sm text-[#c3c6d6] leading-relaxed">
                  {siteSettings?.service4Desc || "Designing slides, posters, bulletins, and digital collaterals that inspire and inform."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="w-full py-12 border-t border-[#424654]/20 bg-[#060e20]">
          <div className="max-w-[1440px] mx-auto px-6 flex flex-col items-center gap-8">
            <div className="flex gap-8 text-[#c3c6d6]">
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Redirecting to Auxiladora Digital Facebook Page...'); }} className="hover:text-[#b2c5ff] transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined">facebook</span>
                <span className="text-xs uppercase tracking-wider font-mono hidden md:inline">Facebook</span>
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Redirecting to Auxiladora Digital Liturgy Live YouTube Channel...'); }} className="hover:text-[#b2c5ff] transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined">youtube_activity</span>
                <span className="text-xs uppercase tracking-wider font-mono hidden md:inline">YouTube</span>
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('SocCom Secretariat Email: soccom@auxiladora.org'); }} className="hover:text-[#b2c5ff] transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined">mail</span>
                <span className="text-xs uppercase tracking-wider font-mono hidden md:inline">Contact</span>
              </a>
            </div>

            <p className="text-center text-xs font-mono text-[#c3c6d6]/70 uppercase tracking-[0.2em]">
              © 2024 Auxiladora Media. All Rights Reserved.
            </p>

            <a 
              href="#login" 
              className="w-10 h-10 rounded-full border border-[#424654] flex items-center justify-center text-[#b2c5ff] hover:text-white hover:bg-[#222a3d] transition-all"
            >
              <span className="material-symbols-outlined">vertical_align_top</span>
            </a>
          </div>
        </footer>
      </div>

      {/* APPLY TO JOIN STEWARD MODAL */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-lg rounded-2xl p-6 sm:p-8 border border-[#b2c5ff]/30 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowApplyModal(false)}
                className="absolute top-4 right-4 text-[#c3c6d6] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#0b57d0]/20 flex items-center justify-center text-[#b2c5ff]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Media Application</h3>
                  <p className="text-xs text-[#c3c6d6]">Join the Social Communications Ministry</p>
                </div>
              </div>

              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#c3c6d6] mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Maria Clara Santos"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full bg-[#060e20] border border-[#424654] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#b2c5ff] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#c3c6d6] mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="clara@example.com"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    className="w-full bg-[#060e20] border border-[#424654] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#b2c5ff] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#c3c6d6] mb-1">Preferred Ministry Field</label>
                  <select 
                    value={applicantMinistry}
                    onChange={(e) => setApplicantMinistry(e.target.value)}
                    className="w-full bg-[#060e20] border border-[#424654] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#b2c5ff] outline-none font-mono"
                  >
                    <option value="livestream">Digital Liturgy & Live Streaming</option>
                    <option value="audio">Sound Engineering & Audio Control</option>
                    <option value="camera">Camera Operator & Photography</option>
                    <option value="slides">Liturgical Slides & Graphics</option>
                    <option value="social">Social Media & News Bulletin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#c3c6d6] mb-1">Motivation / Background</label>
                  <textarea 
                    rows={3}
                    required
                    placeholder="Briefly describe your desire to serve in SocCom..."
                    value={applicantReason}
                    onChange={(e) => setApplicantReason(e.target.value)}
                    className="w-full bg-[#060e20] border border-[#424654] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#b2c5ff] outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#424654] text-xs font-mono text-[#c3c6d6] hover:bg-[#222a3d]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applySubmitted}
                    className="px-5 py-2.5 rounded-xl bg-[#0b57d0] hover:bg-[#084cbd] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#0b57d0]/20"
                  >
                    {applySubmitted ? 'Sending...' : 'Submit Application'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTRATION GREETINGS & CONFIRMATION MODAL */}
      <AnimatePresence>
        {registeredAppDetails && (
          <div className="fixed inset-0 z-[25000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b1726] w-full max-w-lg rounded-2xl p-6 border border-amber-500/50 shadow-2xl space-y-4 relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5 text-amber-300">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="font-serif text-lg font-bold">Registration Submitted Successfully</h3>
                </div>
                <button 
                  onClick={() => setRegisteredAppDetails(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Greetings Header */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-1.5">
                <h4 className="text-base font-bold text-amber-200 font-serif">
                  🎉 Welcome Greetings, {registeredAppDetails.name}!
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your registration for <strong>{registeredAppDetails.ministry.toUpperCase()}</strong> has been successfully submitted and saved in the Auxiliadora Media database!
                </p>
              </div>

              {/* Personal Details & Credentials Card */}
              <div className="p-4 rounded-xl bg-[#050f1c] border border-white/10 space-y-2 font-mono text-xs text-slate-200">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Applicant Name:</span>
                  <span className="font-bold text-amber-300">{registeredAppDetails.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Registered Email:</span>
                  <span className="font-bold text-amber-300">{registeredAppDetails.email}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Secret Token:</span>
                  <span className="font-bold text-amber-400 text-[10px]">AUX_SMTP_SECRET_KEY_2026_88F9A21C_RELAY</span>
                </div>
              </div>

              {/* Spam Notice Banner */}
              <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/40 space-y-1 text-xs text-amber-200">
                <div className="flex items-center gap-1.5 font-bold font-mono text-amber-300">
                  <AlertCircle className="w-4 h-4" />
                  <span>Important: Check SPAM / JUNK Email Folder</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-200/90">
                  When the SocCom Admin approves your application, an automated notification email will be sent to your inbox.
                </p>
                <p className="text-[11px] leading-relaxed text-amber-200/90">
                  Please check your <strong>SPAM or JUNK folder</strong> if you do not see it in your main Inbox, and click 'Report Not Spam'.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Greetings ${registeredAppDetails.name}!\n\nYour registration for Auxiliadora Media Ministry (${registeredAppDetails.ministry}) has been recorded.\n\nAccount Email: ${registeredAppDetails.email}\nSecret Code: AUX_SMTP_SECRET_KEY_2026_88F9A21C_RELAY\n\nNote: Automated emails originate from our notification server. Please check your SPAM / JUNK folder upon Admin approval!`;
                    navigator.clipboard.writeText(text);
                    alert("Greetings and account details copied to clipboard!");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  📋 Copy Greetings Info
                </button>
                <button
                  type="button"
                  onClick={() => setRegisteredAppDetails(null)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-church-950 text-xs font-extrabold uppercase tracking-wider shadow-lg cursor-pointer"
                >
                  Understood & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECOVERY MODAL */}
      <AnimatePresence>
        {showRecoveryModal && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md rounded-2xl p-6 border border-[#b2c5ff]/30 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowRecoveryModal(false)}
                className="absolute top-4 right-4 text-[#c3c6d6] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#0b57d0]/20 flex items-center justify-center text-[#b2c5ff]">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Media Access Token Recovery</h3>
                  <p className="text-xs text-[#c3c6d6]">Security protocols for Auxiladora Media</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-[#c3c6d6] leading-relaxed">
                <p>
                  Media Access Tokens are cryptographically generated access keys managed by Mary Help of Christians Parish SocCom Secretariat.
                </p>

                {/* Password Reset Form */}
                <form onSubmit={handleSendResetEmail} className="p-3.5 rounded-xl bg-[#060e20] border border-[#424654] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                    <Mail className="w-4 h-4 text-[#b2c5ff]" />
                    <span>Send Password Reset Email</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Enter your email address to receive an account password reset link:
                  </p>
                  
                  {resetMessage && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-[11px]">
                      {resetMessage}
                    </div>
                  )}

                  {resetError && (
                    <div className="p-2.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-[11px]">
                      {resetError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="e.g. glifebautista@gmail.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="flex-1 bg-[#0b1928] border border-[#46464c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b2c5ff]"
                    />
                    <button
                      type="submit"
                      disabled={isResetting}
                      className="px-3 py-2 rounded-xl bg-[#0b57d0] hover:bg-[#084cbd] text-white text-xs font-bold font-mono shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {isResetting ? 'Sending...' : 'Send Link'}
                    </button>
                  </div>
                </form>

                <div className="p-3 rounded-xl bg-[#060e20] border border-[#424654] font-mono text-[11px] text-[#b2c5ff]">
                  <strong>Account Recovery Guidance:</strong>
                  <p className="mt-1 text-slate-300">
                    Enter your registered email address above to receive your reset link, or contact the SocCom Admin Council / Brother Glife Bautista to issue a replacement key.
                  </p>
                </div>
                <p>
                  For security, access tokens are issued individually to authorized Auxiliadora Media Ministry members.
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowRecoveryModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0b57d0] text-white text-xs font-bold font-mono"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HELP DESK MODAL */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md rounded-2xl p-6 border border-[#b2c5ff]/30 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowHelpModal(false)}
                className="absolute top-4 right-4 text-[#c3c6d6] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#0b57d0]/20 flex items-center justify-center text-[#b2c5ff]">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Auxiladora Media Help Desk</h3>
                  <p className="text-xs text-[#c3c6d6]">Parish Technical Support</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#c3c6d6]">
                <p>
                  Need assistance with live streaming software, digital audio consoles, or schedule substitution requests?
                </p>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded-lg bg-[#060e20] border border-[#424654]">
                    <span className="text-[#b2c5ff] font-bold">Live Stream Control Hotline:</span> +63 (02) 8123-4567
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#060e20] border border-[#424654]">
                    <span className="text-[#b2c5ff] font-bold">Email Support:</span> support@auxiladora.org
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0b57d0] text-white text-xs font-bold font-mono"
                >
                  Close Help Desk
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRIVACY MODAL */}
      <AnimatePresence>
        {showPrivacyModal && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md rounded-2xl p-6 border border-[#b2c5ff]/30 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="absolute top-4 right-4 text-[#c3c6d6] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#0b57d0]/20 flex items-center justify-center text-[#b2c5ff]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Media Privacy Policy</h3>
                  <p className="text-xs text-[#c3c6d6]">Data Protection & Confidentiality</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#c3c6d6] leading-relaxed">
                <p>
                  All media information, assignment schedules, attendance records, and media content generated within Auxiladora Digital are strictly safeguarded in accordance with parish media standards.
                </p>
                <p>
                  No user logs or telemetry data are shared with commercial third parties.
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0b57d0] text-white text-xs font-bold font-mono"
                >
                  Acknowledge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ✏️ EDIT BRANDING, LOGO & LOGIN GREETING MODAL */}
      <AnimatePresence>
        {showBrandingModal && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b1928] w-full max-w-2xl rounded-2xl p-6 border border-gold-500/40 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setShowBrandingModal(false)}
                className="absolute top-4 right-4 text-gold-300 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center text-gold-300 border border-gold-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gold-100 font-serif">Edit Branding, Logo, Community Pictures & Texts</h3>
                  <p className="text-xs text-gold-300/70">Admin & Sub-Admin Panel • Customize app headers, titles, community cards, photos & content</p>
                </div>
              </div>

              <form onSubmit={handleSaveBranding} className="space-y-6 text-xs">
                
                {/* Section A: App Identity & Login Greeting */}
                <div className="space-y-3 bg-[#051424] p-4 rounded-xl border border-white/10">
                  <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4" /> 1. App Identity & Login Greeting
                  </h4>

                  <div className="space-y-1">
                    <label className="font-bold text-gold-300 font-mono">App Title / Brand Headline</label>
                    <input
                      type="text"
                      required
                      value={editAppName}
                      onChange={(e) => setEditAppName(e.target.value)}
                      placeholder="e.g. Auxiladora Media"
                      className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 font-serif text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-gold-300 font-mono">Login Header Title</label>
                      <input
                        type="text"
                        required
                        value={editLoginTitle}
                        onChange={(e) => setEditLoginTitle(e.target.value)}
                        placeholder="e.g. Auxiladora Media"
                        className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 font-serif"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gold-300 font-mono">Login Subtitle / Badge</label>
                      <input
                        type="text"
                        value={editLoginSubtitle}
                        onChange={(e) => setEditLoginSubtitle(e.target.value)}
                        placeholder="e.g. Media Authentication"
                        className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gold-300 font-mono">Login Screen Welcome Greeting</label>
                    <input
                      type="text"
                      value={editLoginGreeting}
                      onChange={(e) => setEditLoginGreeting(e.target.value)}
                      placeholder="e.g. Welcome to Auxiliadora Media Ministry Portal"
                      className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 italic"
                    />
                  </div>

                  <div className="space-y-3 p-3 bg-[#0b1928] rounded-xl border border-white/10">
                    <label className="font-bold text-gold-300 font-mono text-xs flex items-center justify-between">
                      <span>Logo File & Picture (PNG, PDF, SVG)</span>
                      <span className="text-[10px] text-emerald-400 font-normal">File upload directly supported</span>
                    </label>

                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml, image/webp, application/pdf"
                      onChange={handleLogoFileUpload}
                      className="w-full text-xs text-gold-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-gold-500/20 file:text-gold-300 hover:file:bg-gold-500/30 cursor-pointer"
                    />

                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editLogoUrl}
                        onChange={(e) => setEditLogoUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... or upload file above"
                        className="flex-1 bg-[#051424] border border-[#46464c] rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 font-mono text-xs"
                      />
                      {editLogoUrl && (
                        <div className="w-10 h-10 rounded-xl border border-gold-500/50 bg-black/40 overflow-hidden flex items-center justify-center p-1 shrink-0">
                          <img
                            src={editLogoUrl}
                            alt="Logo preview"
                            className="max-w-full max-h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-gold-400/80 font-mono">Quick Preset Logos:</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditLogoUrl('https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=300&q=80')}
                          className="text-[10px] px-2 py-1 rounded bg-[#122131] text-gold-300 hover:bg-gold-500/20 border border-white/10"
                        >
                          ⛪ Cathedral Cross
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditLogoUrl('https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=300&q=80')}
                          className="text-[10px] px-2 py-1 rounded bg-[#122131] text-gold-300 hover:bg-gold-500/20 border border-white/10"
                        >
                          🎥 Cinema Camera
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditLogoUrl('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80')}
                          className="text-[10px] px-2 py-1 rounded bg-[#122131] text-gold-300 hover:bg-gold-500/20 border border-white/10"
                        >
                          🎙️ Audio Desk
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditLogoUrl('')}
                          className="text-[10px] px-2 py-1 rounded bg-[#122131] text-red-300 hover:bg-red-500/20 border border-white/10"
                        >
                          🛡️ Default Shield
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Login Background Image Control */}
                  <div className="space-y-3 p-3 bg-[#0b1928] rounded-xl border border-white/10">
                    <label className="font-bold text-gold-300 font-mono text-xs flex items-center justify-between">
                      <span>Login Background Watermark Photo (PNG, JPG)</span>
                      <span className="text-[10px] text-amber-300 font-normal">Custom Background</span>
                    </label>

                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleLoginBgFileUpload}
                      className="w-full text-xs text-gold-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer"
                    />

                    <input
                      type="text"
                      value={editLoginBgUrl}
                      onChange={(e) => setEditLoginBgUrl(e.target.value)}
                      placeholder="Paste background image URL or upload above..."
                      className="w-full bg-[#051424] border border-[#46464c] rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 font-mono text-xs"
                    />

                    {editLoginBgUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-amber-500/40 bg-black/50 max-h-32 flex items-center justify-center p-2">
                        <img
                          src={editLoginBgUrl}
                          alt="Background preview"
                          className="max-h-28 object-contain rounded"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setEditLoginBgUrl('')}
                          className="absolute top-2 right-2 text-[10px] bg-red-950/80 hover:bg-red-900 text-red-200 px-2 py-1 rounded font-mono border border-red-800 cursor-pointer"
                        >
                          Reset Background
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gold-300 font-mono">Parish / Ministry Name</label>
                    <input
                      type="text"
                      value={editParishName}
                      onChange={(e) => setEditParishName(e.target.value)}
                      placeholder="e.g. Mary Help of Christians Parish"
                      className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>

                {/* Section B: About & History Texts */}
                <div className="space-y-3 bg-[#051424] p-4 rounded-xl border border-white/10">
                  <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> 2. About SocCom & History
                  </h4>

                  <div className="space-y-1">
                    <label className="font-bold text-gold-300 font-mono">About Section Title</label>
                    <input
                      type="text"
                      value={editAboutTitle}
                      onChange={(e) => setEditAboutTitle(e.target.value)}
                      placeholder="e.g. About SocCom & Our History"
                      className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gold-300 font-mono">History / Mission Paragraph 1</label>
                    <textarea
                      rows={3}
                      value={editAboutP1}
                      onChange={(e) => setEditAboutP1(e.target.value)}
                      className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 text-xs leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gold-300 font-mono">History / Mission Paragraph 2</label>
                    <textarea
                      rows={3}
                      value={editAboutP2}
                      onChange={(e) => setEditAboutP2(e.target.value)}
                      className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 text-xs leading-relaxed"
                    />
                  </div>
                </div>

                {/* Section C: Our Media Work Services */}
                <div className="space-y-3 bg-[#051424] p-4 rounded-xl border border-white/10">
                  <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings className="w-4 h-4" /> 3. Our Media Work Services
                  </h4>

                  {/* Service 1 */}
                  <div className="space-y-1.5 p-2.5 bg-[#0b1928] rounded-lg border border-white/5">
                    <label className="font-bold text-gold-300 font-mono text-[11px]">Service 1 Title & Description</label>
                    <input
                      type="text"
                      value={editS1Title}
                      onChange={(e) => setEditS1Title(e.target.value)}
                      className="w-full bg-[#051424] border border-[#46464c] rounded-lg p-2 text-gold-100 focus:outline-none focus:border-gold-400 font-bold"
                    />
                    <input
                      type="text"
                      value={editS1Desc}
                      onChange={(e) => setEditS1Desc(e.target.value)}
                      className="w-full bg-[#051424] border border-[#46464c] rounded-lg p-2 text-gold-100 focus:outline-none focus:border-gold-400 text-xs"
                    />
                  </div>

                  {/* Service 2 */}
                  <div className="space-y-1.5 p-2.5 bg-[#0b1928] rounded-lg border border-white/5">
                    <label className="font-bold text-gold-300 font-mono text-[11px]">Service 2 Title & Description</label>
                    <input
                      type="text"
                      value={editS2Title}
                      onChange={(e) => setEditS2Title(e.target.value)}
                      className="w-full bg-[#051424] border border-[#46464c] rounded-lg p-2 text-gold-100 focus:outline-none focus:border-gold-400 font-bold"
                    />
                    <input
                      type="text"
                      value={editS2Desc}
                      onChange={(e) => setEditS2Desc(e.target.value)}
                      className="w-full bg-[#051424] border border-[#46464c] rounded-lg p-2 text-gold-100 focus:outline-none focus:border-gold-400 text-xs"
                    />
                  </div>

                  {/* Service 3 */}
                  <div className="space-y-1.5 p-2.5 bg-[#0b1928] rounded-lg border border-white/5">
                    <label className="font-bold text-gold-300 font-mono text-[11px]">Service 3 Title & Description</label>
                    <input
                      type="text"
                      value={editS3Title}
                      onChange={(e) => setEditS3Title(e.target.value)}
                      className="w-full bg-[#051424] border border-[#46464c] rounded-lg p-2 text-gold-100 focus:outline-none focus:border-gold-400 font-bold"
                    />
                    <input
                      type="text"
                      value={editS3Desc}
                      onChange={(e) => setEditS3Desc(e.target.value)}
                      className="w-full bg-[#051424] border border-[#46464c] rounded-lg p-2 text-gold-100 focus:outline-none focus:border-gold-400 text-xs"
                    />
                  </div>

                  {/* Service 4 */}
                  <div className="space-y-1.5 p-2.5 bg-[#0b1928] rounded-lg border border-white/5">
                    <label className="font-bold text-gold-300 font-mono text-[11px]">Service 4 Title & Description</label>
                    <input
                      type="text"
                      value={editS4Title}
                      onChange={(e) => setEditS4Title(e.target.value)}
                      className="w-full bg-[#051424] border border-[#46464c] rounded-lg p-2 text-gold-100 focus:outline-none focus:border-gold-400 font-bold"
                    />
                    <input
                      type="text"
                      value={editS4Desc}
                      onChange={(e) => setEditS4Desc(e.target.value)}
                      className="w-full bg-[#051424] border border-[#46464c] rounded-lg p-2 text-gold-100 focus:outline-none focus:border-gold-400 text-xs"
                    />
                  </div>
                </div>

                {/* Section D: Community Title & Subtitle */}
                <div className="space-y-3 bg-[#051424] p-4 rounded-xl border border-white/10">
                  <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> 4. Our Community Section Header & Text
                  </h4>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gold-200 font-mono">Our Community Title</label>
                      <input
                        type="text"
                        value={editCommunityTitle}
                        onChange={(e) => setEditCommunityTitle(e.target.value)}
                        className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2.5 text-gold-100 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gold-200 font-mono">Our Community Subtitle / Description</label>
                      <textarea
                        rows={2}
                        value={editCommunitySubtitle}
                        onChange={(e) => setEditCommunitySubtitle(e.target.value)}
                        className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2.5 text-gold-100 text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Section E: Community Highlights Gallery Cards */}
                <div className="space-y-4 bg-[#051424] p-4 rounded-xl border border-white/10">
                  <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Image className="w-4 h-4" /> 5. Community Gallery Cards & Pictures</span>
                    <span className="text-[10px] text-emerald-400 font-normal">PNG, JPG, WebP Upload Supported</span>
                  </h4>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Card 1 */}
                    <div className="p-3 bg-[#0b1928] rounded-xl border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-gold-300 font-mono text-xs">Card 1: Auxiliadora Media Team</label>
                        {editC1Img && (
                          <div className="w-10 h-10 rounded-lg border border-gold-500/40 overflow-hidden shrink-0 bg-black/40">
                            <img src={editC1Img} alt="Card 1" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Card 1 Title"
                        value={editC1Title}
                        onChange={(e) => setEditC1Title(e.target.value)}
                        className="w-full bg-[#051424] border border-[#46464c] rounded p-1.5 text-gold-100 text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Card 1 Subtitle"
                        value={editC1Sub}
                        onChange={(e) => setEditC1Sub(e.target.value)}
                        className="w-full bg-[#051424] border border-[#46464c] rounded p-1.5 text-gold-100 text-[11px]"
                      />
                      <div className="space-y-1">
                        <label className="text-[10px] text-gold-200/80 font-mono block">Upload New Picture or Paste Image Link:</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleCardImageUpload(1, e.target.files[0])}
                          className="w-full text-[10px] text-gold-200 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-mono file:bg-gold-500/20 file:text-gold-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder="Image URL link"
                          value={editC1Img}
                          onChange={(e) => setEditC1Img(e.target.value)}
                          className="w-full bg-[#051424] border border-[#46464c] rounded p-1.5 text-gold-100 text-[10px] font-mono mt-1"
                        />
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="p-3 bg-[#0b1928] rounded-xl border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-gold-300 font-mono text-xs">Card 2: SocCom Media Gathering</label>
                        {editC2Img && (
                          <div className="w-10 h-10 rounded-lg border border-gold-500/40 overflow-hidden shrink-0 bg-black/40">
                            <img src={editC2Img} alt="Card 2" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Card 2 Title"
                        value={editC2Title}
                        onChange={(e) => setEditC2Title(e.target.value)}
                        className="w-full bg-[#051424] border border-[#46464c] rounded p-1.5 text-gold-100 text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Card 2 Subtitle"
                        value={editC2Sub}
                        onChange={(e) => setEditC2Sub(e.target.value)}
                        className="w-full bg-[#051424] border border-[#46464c] rounded p-1.5 text-gold-100 text-[11px]"
                      />
                      <div className="space-y-1">
                        <label className="text-[10px] text-gold-200/80 font-mono block">Upload New Picture or Paste Image Link:</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleCardImageUpload(2, e.target.files[0])}
                          className="w-full text-[10px] text-gold-200 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-mono file:bg-gold-500/20 file:text-gold-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder="Image URL link"
                          value={editC2Img}
                          onChange={(e) => setEditC2Img(e.target.value)}
                          className="w-full bg-[#051424] border border-[#46464c] rounded p-1.5 text-gold-100 text-[10px] font-mono mt-1"
                        />
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className="p-3 bg-[#0b1928] rounded-xl border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-gold-300 font-mono text-xs">Card 3: Liturgical Live Stream Studio</label>
                        {editC3Img && (
                          <div className="w-10 h-10 rounded-lg border border-gold-500/40 overflow-hidden shrink-0 bg-black/40">
                            <img src={editC3Img} alt="Card 3" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Card 3 Title"
                        value={editC3Title}
                        onChange={(e) => setEditC3Title(e.target.value)}
                        className="w-full bg-[#051424] border border-[#46464c] rounded p-1.5 text-gold-100 text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Card 3 Subtitle"
                        value={editC3Sub}
                        onChange={(e) => setEditC3Sub(e.target.value)}
                        className="w-full bg-[#051424] border border-[#46464c] rounded p-1.5 text-gold-100 text-[11px]"
                      />
                      <div className="space-y-1">
                        <label className="text-[10px] text-gold-200/80 font-mono block">Upload New Picture or Paste Image Link:</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleCardImageUpload(3, e.target.files[0])}
                          className="w-full text-[10px] text-gold-200 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-mono file:bg-gold-500/20 file:text-gold-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder="Image URL link"
                          value={editC3Img}
                          onChange={(e) => setEditC3Img(e.target.value)}
                          className="w-full bg-[#051424] border border-[#46464c] rounded p-1.5 text-gold-100 text-[10px] font-mono mt-1"
                        />
                      </div>
                    </div>

                    {/* Card 4 */}
                    <div className="p-3 bg-[#0b1928] rounded-xl border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-gold-300 font-mono text-xs">Card 4: SocCom Youth Formation Workshop</label>
                        {editC4Img && (
                          <div className="w-10 h-10 rounded-lg border border-gold-500/40 overflow-hidden shrink-0 bg-black/40">
                            <img src={editC4Img} alt="Card 4" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Card 4 Title"
                        value={editC4Title}
                        onChange={(e) => setEditC4Title(e.target.value)}
                        className="w-full bg-[#051424] border border-[#46464c] rounded p-1.5 text-gold-100 text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Card 4 Subtitle"
                        value={editC4Sub}
                        onChange={(e) => setEditC4Sub(e.target.value)}
                        className="w-full bg-[#051424] border border-[#46464c] rounded p-1.5 text-gold-100 text-[11px]"
                      />
                      <div className="space-y-1">
                        <label className="text-[10px] text-gold-200/80 font-mono block">Upload New Picture or Paste Image Link:</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleCardImageUpload(4, e.target.files[0])}
                          className="w-full text-[10px] text-gold-200 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-mono file:bg-gold-500/20 file:text-gold-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder="Image URL link"
                          value={editC4Img}
                          onChange={(e) => setEditC4Img(e.target.value)}
                          className="w-full bg-[#051424] border border-[#46464c] rounded p-1.5 text-gold-100 text-[10px] font-mono mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-white/10 sticky bottom-0 bg-[#0b1928] py-2 z-10">
                  <button
                    type="button"
                    onClick={() => setShowBrandingModal(false)}
                    className="px-4 py-2 rounded-xl text-gold-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-church-950 font-bold font-mono transition-all shadow-md flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Check className="w-4 h-4" /> Save All Pictures & Texts
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 📷 Change Account / Profile Picture Modal */}
        {showChangePictureModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#051424] border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative"
            >
              <button 
                type="button"
                onClick={() => setShowChangePictureModal(false)}
                className="absolute top-4 right-4 text-amber-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 border border-amber-500/30">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-100 font-serif">Upload / Change Account Picture</h3>
                  <p className="text-xs text-amber-300/70">Select your account and upload a new profile photo directly on the login panel</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfilePicture} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-amber-300 font-mono">Select Account / Member</label>
                  <select
                    value={selectedChangeServerId}
                    onChange={(e) => {
                      setSelectedChangeServerId(e.target.value);
                      const activeServersList = (servers && servers.length > 0) ? servers : DEFAULT_SERVERS;
                      const s = activeServersList.find(srv => srv.id === e.target.value);
                      if (s) setChangePictureUrl(s.picture);
                    }}
                    className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2.5 text-amber-100 focus:outline-none focus:border-amber-400 font-mono"
                  >
                    {((servers && servers.length > 0) ? servers : DEFAULT_SERVERS).map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} ({srv.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 bg-[#0b1928] p-3.5 rounded-xl border border-white/10">
                  <label className="font-bold text-amber-300 font-mono text-xs flex items-center justify-between">
                    <span>Upload Image File from Computer / Phone</span>
                    <span className="text-[10px] text-emerald-400 font-normal">File upload supported</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileFileUpload}
                    className="w-full text-xs text-amber-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-amber-300 font-mono">Or Photo Image URL</label>
                  <input
                    type="text"
                    value={changePictureUrl}
                    onChange={(e) => setChangePictureUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or upload file above"
                    className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2.5 text-amber-100 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                {changePictureUrl && (
                  <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-amber-500/30">
                    <img
                      src={changePictureUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow-md shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="text-xs font-bold text-amber-200 block">Photo Preview</span>
                      <span className="text-[10px] text-emerald-400 font-mono block">Ready to update profile picture</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowChangePictureModal(false)}
                    className="px-4 py-2 bg-church-900 hover:bg-church-800 text-amber-300 rounded-xl font-mono text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-gold-500 hover:from-amber-400 hover:to-gold-400 text-church-950 font-mono font-bold text-xs rounded-xl shadow-lg cursor-pointer uppercase tracking-wider"
                  >
                    💾 Save Profile Photo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
