'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { 
  Activity, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Send, 
  User, 
  MessageSquare, 
  ShieldCheck, 
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { io, Socket } from 'socket.io-client'

const COMMON_MEDICINES = [
  'Paracetamol 500mg',
  'Amoxicillin 500mg',
  'Azithromycin 250mg',
  'Pantoprazole 40mg',
  'Cetirizine 10mg',
  'Ibuprofen 400mg',
  'Metformin 500mg',
  'Amlodipine 5mg',
  'Atorvastatin 10mg',
  'Levothyroxine 50mcg',
  'Omeprazole 20mg',
  'Ciprofloxacin 500mg',
  'Dolo 650mg',
  'Aspirin 75mg',
  'Vitamin D3 60K IU',
  'Cough Syrup (Ascoril D)',
  'Domperidone 10mg',
  'B-Complex (Zincovit)',
  'Loratadine 10mg',
  'Diclofenac 50mg'
];

const COMMON_DOSAGES = [
  '1 Tablet',
  '2 Tablets',
  '1/2 Tablet',
  '1 Capsule',
  '5 ml',
  '10 ml',
  '15 ml',
  '1 Sachet',
  '1 Injection',
  'Local Application (Cream/Ointment)'
];

const COMMON_FREQUENCIES = [
  'Once a day (OD)',
  'Twice a day (BD)',
  'Thrice a day (TDS)',
  'Four times a day (QID)',
  'As needed (SOS)',
  'Before Food (AC)',
  'After Food (PC)',
  'At Bedtime (HS)'
];

const COMMON_DURATIONS = [
  '1 Day',
  '2 Days',
  '3 Days',
  '5 Days',
  '1 Week',
  '10 Days',
  '2 Weeks',
  '1 Month',
  'Till symptoms persist',
  'Ongoing'
];

interface Consultation {
  id: string
  appointmentId: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  specialty: string
  status: string
}

interface Message {
  id: string
  consultationId: string
  senderId: string
  senderName: string
  senderRole: 'PATIENT' | 'DOCTOR'
  content: string
  createdAt?: string
  timestamp?: string
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
}

// Helper to log all 5 WebRTC state metrics accurately
function logWebRTCState(role: string, stepName: string, pc: RTCPeerConnection | null) {
  if (!pc) {
    console.log(`[${role}] ${stepName} | pc=null`)
    return
  }
  console.log(
    `[${role}] ${stepName} | signalingState=${pc.signalingState} | iceConnectionState=${pc.iceConnectionState} | connectionState=${pc.connectionState} | local=${pc.localDescription?.type ?? 'none'} | remote=${pc.remoteDescription?.type ?? 'none'}`
  )
}

export default function VideoConsultationRoomPage() {
  const router = useRouter()
  const params = useParams()
  const consultationId = params?.id as string

  // Helper to extract JWT token
  const getValidJwtToken = (): string => {
    if (typeof window === 'undefined') return ''
    const localToken = localStorage.getItem('accessToken')
    if (localToken && localToken.startsWith('eyJ')) return localToken

    const match = document.cookie.match(/(?:^|; )accessToken=([^;]*)/)
    if (match && match[1] && match[1].startsWith('eyJ')) return match[1]

    return ''
  }

  // Robust Synchronous Role & Identity Resolver
  const resolveUserIdentity = (): { role: 'PATIENT' | 'DOCTOR'; name: string; id: string } => {
    if (typeof window === 'undefined') return { role: 'PATIENT', name: 'Patient', id: 'patient-1' }

    // 0. Priority: URL query param ?role=DOCTOR or ?role=PATIENT
    const searchParams = new URLSearchParams(window.location.search)
    const urlRole = searchParams.get('role')?.toUpperCase()
    if (urlRole === 'DOCTOR') {
      return { role: 'DOCTOR', name: 'Dr. Ananya Sharma', id: 'doc-1' }
    }
    if (urlRole === 'PATIENT') {
      return { role: 'PATIENT', name: 'Abhinav Sharma', id: 'patient-1' }
    }

    // 1. Decode JWT accessToken
    const token = getValidJwtToken()
    if (token) {
      try {
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]))
          if (payload.role === 'DOCTOR') {
            return { role: 'DOCTOR', name: payload.name || 'Dr. Ananya Sharma', id: payload.doctorId || payload.id || 'doc-1' }
          }
          if (payload.role === 'PATIENT') {
            return { role: 'PATIENT', name: payload.name || 'Abhinav Sharma', id: payload.patientId || payload.id || 'patient-1' }
          }
        }
      } catch (e) {}
    }

    // 2. Check localStorage
    const localRole = localStorage.getItem('carepath_role')
    if (localRole === 'DOCTOR') return { role: 'DOCTOR', name: 'Dr. Ananya Sharma', id: 'doc-1' }

    // 3. Check cookies
    const match = document.cookie.match(/(?:^|; )carepath_role=([^;]*)/)
    if (match && match[1] === 'DOCTOR') return { role: 'DOCTOR', name: 'Dr. Ananya Sharma', id: 'doc-1' }

    // 4. Default to Patient
    return { role: 'PATIENT', name: 'Abhinav Sharma', id: 'patient-1' }
  }

  const initialIdentity = resolveUserIdentity()

  // Consultation & User Identity State
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [userRole, setUserRole] = useState<'PATIENT' | 'DOCTOR'>(initialIdentity.role)
  const [userName, setUserName] = useState<string>(initialIdentity.name)
  const [userId, setUserId] = useState<string>(initialIdentity.id)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [completedBy, setCompletedBy] = useState<string | null>(null)
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false)

  // Media Streams & WebRTC State
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [peerJoined, setPeerJoined] = useState(false)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  // Chat State
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState('')

  // Doctor Workspace State
  const [doctorTab, setDoctorTab] = useState<'CHAT'|'NOTES'|'RX'|'INFO'>('CHAT')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [patientContext, setPatientContext] = useState<any>(null)
  const [prescriptionItems, setPrescriptionItems] = useState([{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  const [isSubmittingRx, setIsSubmittingRx] = useState(false)
  
  // Patient Rx Modal State
  const [showRxModal, setShowRxModal] = useState(false)
  const [newPrescription, setNewPrescription] = useState<any>(null)
  const [rxDownloadUrl, setRxDownloadUrl] = useState<string | null>(null)

  // WebRTC, Media & Supabase Realtime Persistent Refs & Locks
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const supabaseChannelRef = useRef<RealtimeChannel | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([])
  const offerCreatedRef = useRef<boolean>(false)
  const answerAppliedRef = useRef<boolean>(false)
  const consultationEndedRef = useRef<boolean>(false)
  const isSetupRunningRef = useRef<boolean>(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Robust Callback Ref for Remote Video
  const setRemoteVideoElement = useCallback((node: HTMLVideoElement | null) => {
    remoteVideoRef.current = node
    if (node && remoteStreamRef.current) {
      console.log(`[WEBRTC ${userRole}] Attached remoteStreamRef to remoteVideoElement callback ref`)
      node.srcObject = remoteStreamRef.current
      node.play().catch((err) => console.warn(`[WEBRTC ${userRole}] remoteVideo callback play warning:`, err))
    }
  }, [userRole])

  // Robust Callback Ref for Local Video
  const setLocalVideoElement = useCallback((node: HTMLVideoElement | null) => {
    localVideoRef.current = node
    if (node && localStreamRef.current) {
      console.log(`[WEBRTC ${userRole}] Attached localStreamRef to localVideoElement callback ref`)
      node.srcObject = localStreamRef.current
      node.play().catch((err) => console.warn(`[WEBRTC ${userRole}] localVideo callback play warning:`, err))
    }
  }, [userRole])

  // Complete WebRTC & Media Track Teardown Helper (Idempotent)
  const performWebRTCConnectionCleanup = () => {
    console.log(`[CONSULTATION LIFECYCLE ${userRole}] Stopping local media & WebRTC connection...`)
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.enabled = false
          track.stop()
          console.log(`[CONSULTATION LIFECYCLE] Stopped local track ${track.kind} (${track.id})`)
        } catch (e) {}
      })
      localStreamRef.current = null
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        try {
          track.enabled = false
          track.stop()
          console.log(`[CONSULTATION LIFECYCLE] Stopped remote track ${track.kind} (${track.id})`)
        } catch (e) {}
      })
      remoteStreamRef.current = null
      setRemoteStream(null)
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.ontrack = null
        peerConnectionRef.current.onicecandidate = null
        peerConnectionRef.current.onconnectionstatechange = null
        peerConnectionRef.current.oniceconnectionstatechange = null
        peerConnectionRef.current.onsignalingstatechange = null
        peerConnectionRef.current.onicegatheringstatechange = null
        peerConnectionRef.current.close()
        console.log(`[CONSULTATION LIFECYCLE] Closed RTCPeerConnection instance`)
      } catch (e) {}
      peerConnectionRef.current = null
    }

    iceCandidateQueueRef.current = []
    offerCreatedRef.current = false
    answerAppliedRef.current = false
    isSetupRunningRef.current = false
    setIsConnected(false)
    setPeerJoined(false)
  }

  // Flush queued ICE Candidates after Remote Description is set
  const processQueuedIceCandidates = async (pc: RTCPeerConnection) => {
    if (iceCandidateQueueRef.current.length > 0) {
      console.log(`[WEBRTC ${userRole}] Flushing ${iceCandidateQueueRef.current.length} queued ICE candidates...`)
    }
    while (iceCandidateQueueRef.current.length > 0) {
      const candidate = iceCandidateQueueRef.current.shift()
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
          logWebRTCState(userRole, 'queued ICE candidate added', pc)
        } catch (err) {
          console.error(`[WEBRTC ERROR ${userRole}] addIceCandidate failed for queued candidate:`, err)
        }
      }
    }
  }

  // 1. Initial Load: Fetch Consultation Details & Authoritative Status Guard
  useEffect(() => {
    if (!consultationId) return

    async function initConsultation() {
      setIsLoading(true)
      try {
        const token = getValidJwtToken()
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        }

        // Fetch Consultation Details
        const res = await fetch(`/api/consultations/${consultationId}`, { headers })
        const data = await res.json()

        if (data.success && data.consultation) {
          setConsultation(data.consultation)
          if (data.consultation.status === 'COMPLETED' || data.consultation.status === 'ENDED') {
            console.log(`[CONSULTATION GUARD] Consultation ${consultationId} is already COMPLETED. Blocking WebRTC initialization.`)
            consultationEndedRef.current = true
            setIsCompleted(true)
          }
        } else {
          setConsultation({
            id: consultationId,
            appointmentId: consultationId,
            patientId: 'patient-1',
            patientName: 'Abhinav Sharma',
            doctorId: 'doc-1',
            doctorName: 'Dr. Ananya Sharma',
            specialty: 'Dermatology',
            status: 'CONNECTED',
          })
        }

        // Fetch Chat History
        const msgRes = await fetch(`/api/consultations/${consultationId}/messages`, { headers }).catch(() => null)
        if (msgRes && msgRes.ok) {
          const msgData = await msgRes.json()
          if (msgData.success && Array.isArray(msgData.messages)) {
            setMessages(msgData.messages)
          }
        }
      } catch (err) {
        setErrorMessage('Failed to load consultation session.')
      } finally {
        setIsLoading(false)
      }
    }

    initConsultation()
  }, [consultationId])

  // 2. WebRTC Peer Connection & Supabase Realtime Signaling / Chat Provider
  useEffect(() => {
    if (!consultationId || isCompleted || consultationEndedRef.current) return
    if (isSetupRunningRef.current) return
    isSetupRunningRef.current = true

    let channel: RealtimeChannel | null = null
    let socket: Socket | null = null

    async function setupWebRTCAndRealtime() {
      try {
        console.log(`[WEBRTC ${userRole}] Initializing consultation room setup...`)

        // A. Request Camera & Microphone Media Stream (getUserMedia)
        console.log(`[${userRole}] getUserMedia requesting...`)
        let stream: MediaStream | null = null
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          localStreamRef.current = stream
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
            console.log(`[${userRole}] localVideo preview assigned`)
          }
          console.log(`[${userRole}] getUserMedia ready | audio tracks=${stream.getAudioTracks().length} | video tracks=${stream.getVideoTracks().length}`)
        } catch (mediaErr: any) {
          console.warn(`[${userRole}] getUserMedia failed/denied:`, mediaErr)
          setMediaError('Camera/Microphone permission denied or unavailable. WebRTC video will be disabled.')
        }

        // B. Initialize RTCPeerConnection & Register ontrack BEFORE negotiation
        console.log(`[${userRole}] RTCPeerConnection initializing...`)
        const pc = new RTCPeerConnection(ICE_SERVERS)
        peerConnectionRef.current = pc
        logWebRTCState(userRole, 'RTCPeerConnection created', pc)

        // Register ontrack Handler FIRST
        pc.ontrack = (event) => {
          if (consultationEndedRef.current) return
          logWebRTCState(userRole, `ontrack received (${event.track.kind})`, pc)
          
          let inboundStream = event.streams && event.streams[0]
          if (!inboundStream) {
            if (!remoteStreamRef.current) {
              remoteStreamRef.current = new MediaStream()
            }
            if (!remoteStreamRef.current.getTracks().some((t) => t.id === event.track.id)) {
              remoteStreamRef.current.addTrack(event.track)
            }
            inboundStream = remoteStreamRef.current
          } else {
            remoteStreamRef.current = inboundStream
          }

          console.log(`[${userRole}] ontrack -> remoteVideo.srcObject assigned stream=${inboundStream.id}`)
          setRemoteStream(inboundStream)
          setIsConnected(true)
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = inboundStream
            remoteVideoRef.current.onloadedmetadata = () => {
              console.log(`[FINAL VIDEO CHECK] role=${userRole} remoteVideoWidth=${remoteVideoRef.current?.videoWidth} remoteVideoHeight=${remoteVideoRef.current?.videoHeight}`)
            }
            remoteVideoRef.current.onresize = () => {
              console.log(`[FINAL VIDEO CHECK] role=${userRole} remoteVideoWidth=${remoteVideoRef.current?.videoWidth} remoteVideoHeight=${remoteVideoRef.current?.videoHeight}`)
            }
            remoteVideoRef.current.play().then(() => {
              console.log(`[WEBRTC ${userRole}] remoteVideo.play() succeeded | readyState=${remoteVideoRef.current?.readyState}`)
              console.log(`[FINAL VIDEO CHECK] role=${userRole} remoteVideoWidth=${remoteVideoRef.current?.videoWidth} remoteVideoHeight=${remoteVideoRef.current?.videoHeight}`)
            }).catch((e) => console.warn(`[${userRole}] play warning:`, e))
          }
        }

        // Add local tracks (addTrack)
        if (stream) {
          stream.getTracks().forEach((track) => {
            console.log(`[${userRole}] addTrack: ${track.kind}`)
            pc.addTrack(track, stream!)
          })
          logWebRTCState(userRole, 'local tracks added', pc)
        }

        // UI changes from "Establishing WebRTC..." ONLY when pc.connectionState === "connected"
        pc.onconnectionstatechange = () => {
          logWebRTCState(userRole, `connectionState change -> ${pc.connectionState}`, pc)
          if (pc.connectionState === 'connected') {
            console.log(`[${userRole}] ICE connected -> pc.connectionState = connected`)
            setIsConnected(true)
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            console.warn(`[${userRole}] pc.connectionState disconnected/failed: ${pc.connectionState}`)
            setIsConnected(false)
          }
        }

        pc.oniceconnectionstatechange = () => {
          logWebRTCState(userRole, `iceConnectionState change -> ${pc.iceConnectionState}`, pc)
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            console.log(`[${userRole}] ICE connected -> iceConnectionState = ${pc.iceConnectionState}`)
            setIsConnected(true)
          }
        }

        pc.onsignalingstatechange = () => {
          logWebRTCState(userRole, `signalingState change -> ${pc.signalingState}`, pc)
        }

        pc.onicegatheringstatechange = () => {
          console.log(`[${userRole}] iceGatheringState: ${pc.iceGatheringState}`)
        }

        // Helper to broadcast signaling messages over Supabase Realtime + Socket fallback
        const broadcastSignal = (event: string, payload: any) => {
          if (supabaseChannelRef.current) {
            supabaseChannelRef.current.send({
              type: 'broadcast',
              event,
              payload,
            })
          }
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit(event, payload)
          }
        }

        // Send local ICE candidates over Supabase Realtime only when connected
        pc.onicecandidate = (event) => {
          if (consultationEndedRef.current) return
          if (event.candidate) {
            console.log(`[${userRole}] onicecandidate -> broadcasting ICE candidate`)
            broadcastSignal('signal:ice-candidate', {
              consultationId,
              candidate: event.candidate,
              role: userRole,
            })
          }
        }

        // Function for Patient (offerer ONLY) to create & send SDP offer
        const sendOffer = async (forceResend = false) => {
          if (userRole !== 'PATIENT' || consultationEndedRef.current) return
          const currentPc = peerConnectionRef.current
          if (!currentPc) return

          if (offerCreatedRef.current && !forceResend) {
            return
          }

          try {
            offerCreatedRef.current = true
            console.log(`[PATIENT] createOffer (iceRestart: ${forceResend})`)
            const offer = await currentPc.createOffer({ iceRestart: forceResend })
            console.log(`[PATIENT] setLocalDescription`)
            await currentPc.setLocalDescription(offer)
            logWebRTCState('PATIENT', 'setLocalDescription complete', currentPc)

            console.log(`[PATIENT] signal:offer sent via Supabase`)
            broadcastSignal('signal:offer', {
              consultationId,
              offer,
              role: 'PATIENT',
            })
          } catch (err) {
            offerCreatedRef.current = false
            console.error(`[PATIENT] createOffer or setLocalDescription failed:`, err)
          }
        }

        // Handlers
        const handleSignalJoin = async (data: any) => {
          console.log(`[WEBRTC ${userRole}] Peer joined room:`, data)
          setPeerJoined(true)
          if (userRole === 'PATIENT' && !consultationEndedRef.current) {
            await sendOffer(true)
          }
        }

        // Doctor is the ONLY answerer
        const handleSignalOffer = async (data: any) => {
          if (consultationEndedRef.current) return
          if (userRole !== 'DOCTOR') return // Doctor is the ONLY answerer

          const currentPc = peerConnectionRef.current
          if (!currentPc || !data?.offer) return
          if (currentPc.signalingState !== 'stable') {
            console.warn(`[DOCTOR] ignoring offer received in state ${currentPc.signalingState}`)
            return
          }

          try {
            console.log(`[DOCTOR] receive offer via Supabase`)
            console.log(`[DOCTOR] setRemoteDescription`)
            await currentPc.setRemoteDescription(new RTCSessionDescription(data.offer))
            logWebRTCState('DOCTOR', 'setRemoteDescription complete', currentPc)

            // Flush queued ICE candidates received before remote SDP
            await processQueuedIceCandidates(currentPc)

            console.log(`[DOCTOR] createAnswer`)
            const answer = await currentPc.createAnswer()
            console.log(`[DOCTOR] setLocalDescription`)
            await currentPc.setLocalDescription(answer)
            logWebRTCState('DOCTOR', 'setLocalDescription complete', currentPc)

            console.log(`[DOCTOR] signal:answer sent via Supabase`)
            broadcastSignal('signal:answer', {
              consultationId,
              answer,
              role: 'DOCTOR',
            })
          } catch (err) {
            console.error(`[DOCTOR] setRemoteDescription(offer) or createAnswer failed:`, err)
          }
        }

        // Patient receives answer ONLY
        const handleSignalAnswer = async (data: any) => {
          if (consultationEndedRef.current) return
          if (userRole !== 'PATIENT') return // Patient receives answer ONLY
          if (answerAppliedRef.current) {
            console.warn(`[PATIENT] ignoring duplicate answer`)
            return
          }

          const currentPc = peerConnectionRef.current
          if (!currentPc || !data?.answer) return
          if (currentPc.signalingState !== 'have-local-offer') {
            console.warn(`[PATIENT] ignoring answer in state ${currentPc.signalingState}`)
            return
          }

          try {
            console.log(`[PATIENT] receive answer via Supabase`)
            console.log(`[PATIENT] setRemoteDescription`)
            await currentPc.setRemoteDescription(new RTCSessionDescription(data.answer))
            answerAppliedRef.current = true
            logWebRTCState('PATIENT', 'setRemoteDescription complete', currentPc)

            // Flush queued ICE candidates received before remote SDP
            await processQueuedIceCandidates(currentPc)
          } catch (err) {
            console.error(`[PATIENT] setRemoteDescription(answer) failed:`, err)
          }
        }

        const handleSignalIceCandidate = async (data: any) => {
          if (consultationEndedRef.current) return
          if (data.role === userRole) return // Don't add own candidates
          const currentPc = peerConnectionRef.current
          if (!data?.candidate) return

          if (currentPc && currentPc.remoteDescription && currentPc.remoteDescription.type) {
            try {
              await currentPc.addIceCandidate(new RTCIceCandidate(data.candidate))
              logWebRTCState(userRole, 'ICE candidate added directly', currentPc)
            } catch (err) {
              console.error(`[WEBRTC ERROR ${userRole}] addIceCandidate failed:`, err)
            }
          } else {
            console.log(`[WEBRTC ${userRole}] Queuing ICE candidate before remote SDP...`)
            iceCandidateQueueRef.current.push(data.candidate)
          }
        }

        // Realtime Chat Receiver Handler (with strict deduplication by ID or content/role)
        const handleIncomingChatMessage = (incomingMsg: any) => {
          if (incomingMsg && incomingMsg.content) {
            console.log(`[CHAT ${userRole}] RECEIVED ${incomingMsg.content}`)
            setMessages((prev) => {
              if (prev.some((m) => m.id === incomingMsg.id || (m.content === incomingMsg.content && m.senderRole === incomingMsg.senderRole && Math.abs(new Date(m.timestamp || Date.now()).getTime() - new Date(incomingMsg.timestamp || Date.now()).getTime()) < 3000))) {
                return prev
              }
              return [...prev, incomingMsg]
            })
          }
        }

        const handlePrescriptionCreated = (payload: any) => {
          console.log(`[WEBRTC ${userRole}] Received prescription:created event:`, payload);
          if (userRole === 'PATIENT' && payload.prescription) {
            setNewPrescription(payload.prescription);
            setShowRxModal(true);
          }
        }

        const handleConsultationEndEvent = (payload: any) => {
          if (consultationEndedRef.current) return
          console.log(`[CONSULTATION LIFECYCLE ${userRole}] consultation:ended received. Payload:`, payload)
          consultationEndedRef.current = true
          performWebRTCConnectionCleanup()

          setIsCompleted(true)
          setCompletedBy(payload?.endedBy || (userRole === 'PATIENT' ? 'Doctor' : 'Patient'))

          if (userRole === 'PATIENT') {
            console.log('[CONSULTATION LIFECYCLE] Redirecting patient automatically to /patient/dashboard...')
            setTimeout(() => {
              router.push('/patient/dashboard')
            }, 1200)
          }
        }

        // C. Initialize Supabase Realtime Channel
        console.log(`[SUPABASE REALTIME] Subscribing to consultation:${consultationId}`)
        channel = supabase.channel(`consultation:${consultationId}`, {
          config: { broadcast: { self: false } },
        })
        supabaseChannelRef.current = channel

        channel
          .on('broadcast', { event: 'signal:join' }, (p) => handleSignalJoin(p.payload))
          .on('broadcast', { event: 'signal:offer' }, (p) => handleSignalOffer(p.payload))
          .on('broadcast', { event: 'signal:answer' }, (p) => handleSignalAnswer(p.payload))
          .on('broadcast', { event: 'signal:ice-candidate' }, (p) => handleSignalIceCandidate(p.payload))
          .on('broadcast', { event: 'chat:message' }, (p) => handleIncomingChatMessage(p.payload))
          .on('broadcast', { event: 'prescription:created' }, (p) => handlePrescriptionCreated(p.payload))
          .on('broadcast', { event: 'consultation:ended' }, (p) => handleConsultationEndEvent(p.payload))
          .subscribe((status) => {
            console.log(`[SUPABASE REALTIME ${userRole}] Subscription status: ${status}`)
            if (status === 'SUBSCRIBED') {
              setRealtimeConnected(true)
              channel?.send({
                type: 'broadcast',
                event: 'signal:join',
                payload: { role: userRole, senderId: userId },
              })
              if (userRole === 'PATIENT' && !consultationEndedRef.current) {
                sendOffer(false)
              }
            }
          })

        // D. Initialize Socket.io as Fallback Transport
        try {
          const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          socket = io(socketUrl, {
            path: '/socket.io/',
            transports: ['polling', 'websocket'],
            reconnection: true,
          })
          socketRef.current = socket

          socket.on('connect', () => {
            console.log(`[SOCKET ${userRole}] CONNECTED ${socket?.id}`)
            socket?.emit('consultation:join', { consultationId, role: userRole })
          })
          socket.on('consultation:joined', (data) => {
            if (data.members >= 2) setPeerJoined(true)
            if (userRole === 'PATIENT' && !consultationEndedRef.current) sendOffer(false)
          })
          socket.on('signal:join', handleSignalJoin)
          socket.on('signal:offer', handleSignalOffer)
          socket.on('signal:answer', handleSignalAnswer)
          socket.on('signal:ice-candidate', handleSignalIceCandidate)
          socket.on('chat:message', handleIncomingChatMessage)
          socket.on('prescription:created', handlePrescriptionCreated)
          socket.on('consultation:ended', handleConsultationEndEvent)
        } catch (e) {}

      } catch (err: any) {
        console.error(`Media permission or WebRTC setup error (${userRole})`, err)
        setMediaError(err.message || 'Camera or Microphone permission denied.')
      }
    }

    setupWebRTCAndRealtime()

    return () => {
      if (consultationEndedRef.current) {
        performWebRTCConnectionCleanup()
        if (supabaseChannelRef.current) {
          supabase.removeChannel(supabaseChannelRef.current)
          supabaseChannelRef.current = null
        }
        if (socketRef.current) {
          socketRef.current.emit('consultation:leave', { consultationId, role: userRole })
          socketRef.current.disconnect()
          socketRef.current = null
        }
      }
    }
  }, [consultationId, isCompleted])

  // Auto Scroll Chat to Bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Media Track Toggles (Mute / Camera)
  const handleToggleMicrophone = () => {
    if (!localStreamRef.current) return
    const audioTrack = localStreamRef.current.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !isMicOn
      setIsMicOn(!isMicOn)
      console.log(`[WEBRTC ${userRole}] Microphone toggled: enabled=${!isMicOn}`)
    }
  }

  const handleToggleCamera = () => {
    if (!localStreamRef.current) return
    const videoTrack = localStreamRef.current.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !isCameraOn
      setIsCameraOn(!isCameraOn)
      console.log(`[WEBRTC ${userRole}] Camera toggled: enabled=${!isCameraOn}`)
    }
  }

  // Handle unexpected unloads (e.g., closing the tab)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isCompleted && consultationId) {
        const token = getValidJwtToken()
        const url = `/api/consultations/${consultationId}/end`
        
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({}),
          keepalive: true,
        }).catch(() => null)
        
        if (socketRef.current) {
          socketRef.current.emit('consultation:end', {
            consultationId,
            endedBy: userRole === 'DOCTOR' ? 'Doctor (Disconnected)' : 'Patient (Disconnected)',
          })
        }
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isCompleted, consultationId, userRole])

  // Doctor / Patient Confirmed End Consultation Execution
  const executeEndConsultation = async () => {
    setShowEndConfirmModal(false)
    console.log(`[CONSULTATION LIFECYCLE ${userRole}] User initiated consultation termination...`)
    consultationEndedRef.current = true

    try {
      const token = getValidJwtToken()
      const res = await fetch(`/api/consultations/${consultationId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      }).catch(() => null)

      if (res) {
        console.log(`[CONSULTATION LIFECYCLE] Backend API marked status as COMPLETED`)
      }

      // Emit consultation:ended over Supabase Realtime
      if (supabaseChannelRef.current) {
        console.log(`[CONSULTATION LIFECYCLE] Broadcasting consultation:ended over Supabase Realtime channel consultation:${consultationId}`)
        supabaseChannelRef.current.send({
          type: 'broadcast',
          event: 'consultation:ended',
          payload: {
            consultationId,
            endedBy: userRole === 'DOCTOR' ? 'Doctor' : 'Patient',
          },
        })
      }

      // Emit consultation:end over Socket.io
      if (socketRef.current) {
        socketRef.current.emit('consultation:end', {
          consultationId,
          endedBy: userRole === 'DOCTOR' ? 'Doctor' : 'Patient',
        })
      }
    } finally {
      performWebRTCConnectionCleanup()
      setIsCompleted(true)
      setCompletedBy(userRole === 'DOCTOR' ? 'Doctor' : 'Patient')

      setTimeout(() => {
        if (userRole === 'PATIENT') {
          router.push('/patient/dashboard')
        } else {
          router.push('/doctor/dashboard')
        }
      }, 1500)
    }
  }

  // Doctor Workspace: Fetch Patient Context
  const [patientContextError, setPatientContextError] = useState<string | null>(null);

  const fetchContext = async () => {
    try {
      setPatientContextError(null);
      const token = getValidJwtToken();
      const res = await fetch(`/api/patient/context/${consultationId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        }
      });
      const data = await res.json();
      if (data.success && data.patient) {
        setPatientContext(data.patient);
      } else {
        setPatientContextError(data.message || 'Failed to load patient history.');
      }
    } catch (err) {
      setPatientContextError('Network error loading patient history.');
    }
  };

  useEffect(() => {
    if (userRole === 'DOCTOR' && consultationId) {
      fetchContext();
    }
  }, [userRole, consultationId]);

  // Doctor Workspace: Auto-save Clinical Notes
  useEffect(() => {
    if (userRole !== 'DOCTOR' || !consultationId) return;
    const timer = setTimeout(async () => {
      if (!clinicalNotes) return;
      setIsSavingNotes(true);
      try {
        const token = getValidJwtToken();
        await fetch(`/api/consultations/${consultationId}/notes`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ notes: clinicalNotes }),
        });
      } catch (err) {}
      setIsSavingNotes(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [clinicalNotes, consultationId, userRole]);

  // Doctor Workspace: Prescription Handlers
  const addPrescriptionItem = () => {
    setPrescriptionItems([...prescriptionItems, { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removePrescriptionItem = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const updatePrescriptionItem = (index: number, field: string, value: string) => {
    const updated = [...prescriptionItems];
    (updated[index] as any)[field] = value;
    setPrescriptionItems(updated);
  };

  const submitPrescription = async (isDraft: boolean = false) => {
    if (isSubmittingRx || prescriptionItems.length === 0) return;
    setIsSubmittingRx(true);
    try {
      const token = getValidJwtToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          consultationId,
          isDraft,
          items: prescriptionItems.filter(i => i.medicineName.trim() !== '')
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (isDraft) {
           alert('Draft saved successfully!');
        } else {
           alert('Prescription issued successfully!');
           setPrescriptionItems([{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
        }
      } else {
        alert(data.message || 'Failed to save prescription.');
      }
    } catch (err) {
      alert('Failed to process prescription.');
      console.error(err);
    } finally {
      setIsSubmittingRx(false);
    }
  };

  // Real-Time Chat Send Handler (Instant local update + Instant Supabase broadcast + Background HTTP save)
  const handleSendMessage = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault()
    const messageText = chatInput.trim()
    if (!messageText || isCompleted) return

    setChatInput('')

    const messageId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const newMsg: Message = {
      id: messageId,
      consultationId,
      senderId: userId || (userRole === 'DOCTOR' ? 'doc-1' : 'patient-1'),
      senderName: userName || (userRole === 'DOCTOR' ? (consultation?.doctorName || 'Dr. Ananya Sharma') : 'Abhinav Sharma'),
      senderRole: userRole,
      content: messageText,
      timestamp: new Date().toISOString(),
    }

    // 1. Update sender local messages list immediately
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev
      return [...prev, newMsg]
    })

    // 2. Broadcast over Supabase Realtime channel instantly
    if (supabaseChannelRef.current) {
      console.log(`[CHAT ${userRole}] Broadcasting message via Supabase Realtime:`, messageText)
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'chat:message',
        payload: newMsg,
      })
    }

    // 3. Fallback broadcast over Socket.io
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('chat:send', {
        consultationId,
        message: newMsg,
      })
    }

    // 4. Persist message to API in background (non-blocking)
    const token = getValidJwtToken()
    fetch(`/api/consultations/${consultationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content: messageText }),
    }).catch((err) => {
      console.warn(`[CHAT PERSISTENCE WARNING] HTTP message save failed:`, err)
    })
  }

  // RENDER COMPLETED / ENDED SESSION SUMMARY SCREEN (OR DIRECT COMPLETED GUARD)
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center p-4">
        <div className="bg-[#171717] rounded-3xl max-w-lg w-full p-8 border border-[#2A2A2A] shadow-2xl text-center space-y-6 animate-fadeIn">
          
          <div className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">
              {userRole === 'DOCTOR' ? '✓ Consultation Finished' : '✓ Consultation Completed'}
            </h1>
            <p className="text-xs text-[#999999]">
              {userRole === 'PATIENT'
                ? 'Your doctor has ended the consultation. This session is now closed.'
                : 'You have ended the consultation session. This session is permanently completed.'}
            </p>
          </div>

          {/* Session Summary Box */}
          <div className="bg-[#222222] rounded-2xl p-5 border border-[#333333] text-left space-y-3 text-xs text-[#CCCCCC]">
            <div className="flex justify-between border-b border-[#333333] pb-2.5">
              <span className="font-semibold text-[#888888]">Doctor:</span>
              <span className="font-bold text-white">{consultation?.doctorName || 'Dr. Ananya Sharma'}</span>
            </div>
            <div className="flex justify-between border-b border-[#333333] pb-2.5">
              <span className="font-semibold text-[#888888]">Specialty:</span>
              <span className="font-bold text-[#EF3030]">{consultation?.specialty || 'Dermatology'}</span>
            </div>
            <div className="flex justify-between border-b border-[#333333] pb-2.5">
              <span className="font-semibold text-[#888888]">Consultation ID:</span>
              <span className="font-bold text-white">{consultationId}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-[#888888]">Session Status:</span>
              <span className="font-bold text-emerald-400 uppercase">FINISHED / COMPLETED</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push(userRole === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard')}
            className="w-full py-3.5 rounded-2xl bg-[#EF3030] hover:bg-[#D92727] text-white font-bold text-xs shadow-xl shadow-red-500/20 transition-all uppercase tracking-wider cursor-pointer"
          >
            Back to Dashboard
          </button>

        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col justify-between overflow-hidden relative">
      
      {/* End Consultation Confirmation Modal */}
      {showEndConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#171717] rounded-3xl max-w-md w-full p-6 border border-[#2A2A2A] shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
              <div className="flex items-center space-x-2 text-red-500">
                <PhoneOff className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">End Consultation?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEndConfirmModal(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#AAAAAA] leading-relaxed">
              <p className="text-white font-semibold text-sm">
                Are you sure you want to end this consultation session?
              </p>
              <p>
                Once ended, the consultation will be permanently marked as <strong className="text-emerald-400">COMPLETED</strong>. Neither participant will be able to resume or rejoin this call.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEndConfirmModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#262626] hover:bg-[#333333] text-white font-bold text-xs border border-[#333333] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeEndConsultation}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                End Consultation
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Patient Rx Modal */}
      {showRxModal && newPrescription && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#171717] rounded-3xl max-w-md w-full p-6 border border-[#2A2A2A] shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
              <div className="flex items-center space-x-2 text-[#EF3030]">
                <Activity className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">New Prescription</h3>
              </div>
              <button onClick={() => setShowRxModal(false)} className="text-neutral-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-[#AAAAAA] leading-relaxed">
              <p className="text-white font-semibold text-sm">
                Dr. {consultation?.doctorName} has issued a new prescription for you.
              </p>
              <p>You can download the secure PDF now.</p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRxModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#262626] hover:bg-[#333333] text-white font-bold text-xs border border-[#333333] transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const token = getValidJwtToken();
                    const res = await fetch(`/api/prescriptions/${newPrescription.id}/pdf`, {
                      headers: token ? { authorization: `Bearer ${token}` } : {}
                    });
                    const data = await res.json();
                    if (data.success && data.downloadUrl) {
                      window.open(data.downloadUrl, '_blank');
                      setShowRxModal(false);
                    } else {
                      alert('Could not fetch prescription PDF.');
                    }
                  } catch (err) {
                    alert('Error downloading prescription.');
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar Header */}
      <header className="bg-[#171717] border-b border-[#2A2A2A] h-16 px-6 flex items-center justify-between z-30">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#EF3030] flex items-center justify-center text-white font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white leading-tight">
              {consultation ? `${consultation.doctorName} · ${consultation.specialty}` : 'CarePath Telemedicine Consultation'}
            </h1>
            <p className="text-[10px] text-[#999999]">Encrypted HD WebRTC Medical Session</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 ${
            realtimeConnected
              ? 'bg-emerald-950 border border-emerald-600 text-emerald-400'
              : 'bg-amber-950 border border-amber-600 text-amber-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{realtimeConnected ? 'Supabase Realtime Active' : 'Connecting Realtime...'}</span>
          </span>

          {/* DOCTOR / PATIENT END CONSULTATION BUTTON */}
          <button
            type="button"
            onClick={() => setShowEndConfirmModal(true)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Consultation</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Dual Video + Live Chat */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 max-w-7xl mx-auto w-full overflow-hidden">
        
        {/* Video Area (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
          
          {/* Main Remote Video Container (Large Screen) */}
          <div className="relative flex-1 bg-[#1A1A1A] rounded-3xl overflow-hidden border border-[#2A2A2A] shadow-2xl flex items-center justify-center min-h-[400px]">
            
            {/* Remote Video Stream (Large Screen) */}
            <video
              ref={setRemoteVideoElement}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Connecting / Waiting Overlay: Hidden when remoteStream exists OR isConnected */}
            {(!isConnected && !remoteStream) && (
              <div className="absolute inset-0 bg-[#171717]/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 space-y-4 z-10">
                <div className="w-16 h-16 rounded-full bg-[#EF3030]/20 text-[#EF3030] flex items-center justify-center animate-pulse">
                  <Video className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-white">
                    {!peerJoined 
                      ? (userRole === 'PATIENT' ? 'Waiting for Doctor to Join...' : 'Waiting for Patient to Join...')
                      : (realtimeConnected ? 'Establishing WebRTC HD Video Stream...' : 'Connecting Supabase Realtime...')}
                  </h3>
                  <p className="text-xs text-[#999999] max-w-md leading-relaxed">
                    {!peerJoined 
                      ? (userRole === 'PATIENT' 
                          ? 'Dr. Ananya Sharma has not entered the consultation room yet.' 
                          : 'Waiting for patient to enter the consultation room.')
                      : 'Exchanging SDP offer & answer via Supabase Realtime to establish encrypted peer video.'}
                  </p>
                </div>
              </div>
            )}

            {/* Media Permission Error Banner */}
            {mediaError && (
              <div className="absolute top-4 left-4 right-4 z-20 bg-red-950/90 border border-red-600 text-red-200 p-3.5 rounded-2xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-[#FF6B6B] flex-shrink-0" />
                <span>{mediaError}</span>
              </div>
            )}

            {/* Local Self-Preview Floating Video (PiP Small Screen) */}
            <div className="absolute bottom-4 right-4 w-40 h-28 sm:w-52 sm:h-36 bg-black rounded-2xl overflow-hidden border-2 border-[#EF3030] shadow-2xl z-20">
              <video
                ref={setLocalVideoElement}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1.5 left-2 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md text-[9px] font-bold text-white uppercase">
                You ({userRole})
              </span>
            </div>

          </div>

          {/* Bottom Control Bar */}
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-4 flex items-center justify-center space-x-6 shadow-xl">
            
            {/* Microphone Control Toggle */}
            <button
              type="button"
              onClick={handleToggleMicrophone}
              className={`p-4 rounded-2xl transition-all shadow-lg flex items-center space-x-2 text-xs font-bold cursor-pointer ${
                isMicOn
                  ? 'bg-[#262626] hover:bg-[#333333] text-white border border-[#333333]'
                  : 'bg-red-600 hover:bg-red-700 text-white border border-red-500 animate-pulse'
              }`}
            >
              {isMicOn ? <Mic className="w-5 h-5 text-emerald-400" /> : <MicOff className="w-5 h-5 text-white" />}
              <span>{isMicOn ? 'Microphone ON' : 'Microphone OFF'}</span>
            </button>

            {/* Camera Control Toggle */}
            <button
              type="button"
              onClick={handleToggleCamera}
              className={`p-4 rounded-2xl transition-all shadow-lg flex items-center space-x-2 text-xs font-bold cursor-pointer ${
                isCameraOn
                  ? 'bg-[#262626] hover:bg-[#333333] text-white border border-[#333333]'
                  : 'bg-red-600 hover:bg-red-700 text-white border border-red-500 animate-pulse'
              }`}
            >
              {isCameraOn ? <Video className="w-5 h-5 text-emerald-400" /> : <VideoOff className="w-5 h-5 text-white" />}
              <span>{isCameraOn ? 'Camera ON' : 'Camera OFF'}</span>
            </button>

            {/* End Call */}
            <button
              type="button"
              onClick={() => setShowEndConfirmModal(true)}
              className="p-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
            >
              <PhoneOff className="w-5 h-5" />
              <span>End Consultation</span>
            </button>

          </div>

        </div>

        {/* Right Panel (Chat / Doctor Workspace) */}
        <div className="lg:col-span-1 bg-[#171717] border border-[#2A2A2A] rounded-3xl flex flex-col overflow-hidden shadow-xl min-h-[450px]">
          
          {/* Doctor Workspace Tabs */}
          {userRole === 'DOCTOR' && (
            <div className="flex bg-[#222222] border-b border-[#2A2A2A]">
              <button 
                onClick={() => setDoctorTab('CHAT')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${doctorTab === 'CHAT' ? 'text-[#EF3030] border-b-2 border-[#EF3030]' : 'text-[#888888] hover:text-white'}`}
              >
                Chat
              </button>
              <button 
                onClick={() => setDoctorTab('NOTES')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${doctorTab === 'NOTES' ? 'text-[#EF3030] border-b-2 border-[#EF3030]' : 'text-[#888888] hover:text-white'}`}
              >
                Notes
              </button>
              <button 
                onClick={() => setDoctorTab('RX')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${doctorTab === 'RX' ? 'text-[#EF3030] border-b-2 border-[#EF3030]' : 'text-[#888888] hover:text-white'}`}
              >
                Rx
              </button>
              <button 
                onClick={() => setDoctorTab('INFO')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${doctorTab === 'INFO' ? 'text-[#EF3030] border-b-2 border-[#EF3030]' : 'text-[#888888] hover:text-white'}`}
              >
                Pt. Info
              </button>
            </div>
          )}

          {/* CHAT TAB / PATIENT DEFAULT */}
          {(userRole === 'PATIENT' || doctorTab === 'CHAT') && (
            <div className="flex-1 flex flex-col overflow-hidden h-full">
              {/* Chat Header */}
              <div className="p-4 bg-[#222222] border-b border-[#2A2A2A] flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white">
                  <MessageSquare className="w-4 h-4 text-[#EF3030]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider">Consultation Chat</h3>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">● Supabase Realtime</span>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[#777777] space-y-2">
                    <MessageSquare className="w-6 h-6 text-[#444444] mx-auto" />
                    <p>No messages yet. Send a message to start chatting in real time.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderRole === userRole

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div className="flex items-center space-x-1.5 text-[10px] text-[#888888]">
                          <span className="font-bold text-white">{msg.senderName}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase ${
                            msg.senderRole === 'DOCTOR' ? 'bg-purple-950 text-purple-300' : 'bg-blue-950 text-blue-300'
                          }`}>
                            {msg.senderRole}
                          </span>
                        </div>

                        <div className={`px-3.5 py-2 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                          isMe
                            ? 'bg-[#EF3030] text-white rounded-br-none shadow-sm'
                            : 'bg-[#2A2A2A] text-neutral-100 rounded-bl-none border border-[#333333]'
                        }`}>
                          {msg.content}
                        </div>

                        <span className="text-[9px] text-[#666666]">
                          {new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Form */}
              <form 
                onSubmit={handleSendMessage} 
                className="p-3 bg-[#222222] border-t border-[#2A2A2A] flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={isCompleted}
                  placeholder={isCompleted ? 'Consultation ended' : 'Type message to doctor...'}
                  className="flex-1 bg-[#111111] border border-[#333333] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#777777] focus:outline-none focus:ring-1 focus:ring-[#EF3030] disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim() || isCompleted}
                  className="p-2 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white disabled:opacity-40 transition-all shadow-sm cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* NOTES TAB */}
          {userRole === 'DOCTOR' && doctorTab === 'NOTES' && (
            <div className="flex-1 flex flex-col p-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white mb-2">Clinical Notes</h3>
              <p className="text-[10px] text-[#888888] mb-4">These notes are private and auto-saved.</p>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Type clinical observations, symptoms, diagnosis..."
                className="flex-1 w-full bg-[#111111] border border-[#333333] rounded-xl p-3 text-xs text-white placeholder-[#777777] focus:outline-none focus:ring-1 focus:ring-[#EF3030] resize-none"
              />
              <div className="mt-2 text-right">
                <span className="text-[10px] text-[#666666]">
                  {isSavingNotes ? 'Saving...' : 'All changes saved.'}
                </span>
              </div>
            </div>
          )}

          {/* PATIENT INFO TAB */}
          {userRole === 'DOCTOR' && doctorTab === 'INFO' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white mb-4">Patient Profile</h3>
              
              {patientContextError ? (
                <div className="text-center py-6 px-4 bg-[#222222] border border-[#333333] rounded-xl space-y-3">
                  <div className="text-[#EF3030] font-bold text-sm">Error Loading History</div>
                  <div className="text-xs text-[#888888]">{patientContextError}</div>
                  <button onClick={fetchContext} className="px-4 py-2 bg-[#333333] hover:bg-[#444444] text-white rounded-lg text-xs font-bold transition-colors">
                    Retry
                  </button>
                </div>
              ) : !patientContext ? (
                <div className="text-center py-4 text-xs text-[#888888]">Loading...</div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="bg-[#222222] p-3 rounded-xl border border-[#333333]">
                    <p><span className="text-[#888888]">Name:</span> <span className="text-white font-bold">{patientContext.name}</span></p>
                    <p><span className="text-[#888888]">Age/Gender:</span> <span className="text-white font-bold">{patientContext.age} / {patientContext.gender}</span></p>
                    <p><span className="text-[#888888]">Blood Group:</span> <span className="text-white font-bold">{patientContext.bloodGroup || 'N/A'}</span></p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-[#888888] mb-1">Known Conditions</h4>
                    {patientContext.knownConditions?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {patientContext.knownConditions.map((c: string) => <span key={c} className="bg-[#333333] px-2 py-1 rounded text-white text-[10px]">{c}</span>)}
                      </div>
                    ) : <p className="text-[10px] text-[#666666]">None reported.</p>}
                  </div>

                  <div>
                    <h4 className="font-bold text-[#888888] mb-1">Allergies</h4>
                    {patientContext.allergies?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {patientContext.allergies.map((a: string) => <span key={a} className="bg-red-900/50 text-red-200 border border-red-800 px-2 py-1 rounded text-[10px]">{a}</span>)}
                      </div>
                    ) : <p className="text-[10px] text-[#666666]">None reported.</p>}
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-[#888888] mb-1">Current Medications</h4>
                    {patientContext.medications?.length ? (
                      <ul className="list-disc list-inside text-white text-[10px]">
                        {patientContext.medications.map((m: string) => <li key={m}>{m}</li>)}
                      </ul>
                    ) : <p className="text-[10px] text-[#666666]">None reported.</p>}
                  </div>

                  <div className="pt-4 border-t border-[#333333]">
                    <h4 className="font-bold text-[#EF3030] mb-2">Schedule Follow-up</h4>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/followup`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({
                              patientId: patientContext.patientId || patientContext.id,
                              date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
                              timeSlot: '10:00 AM'
                            })
                          });
                          if (!res.ok) throw new Error('Failed to book follow-up');
                          alert('Follow-up appointment booked successfully for next week!');
                        } catch (err) {
                          alert('Error booking follow-up appointment');
                          console.error(err);
                        }
                      }}
                      className="w-full py-2 bg-[#2A2A2A] hover:bg-[#333333] text-white border border-[#444444] rounded-xl text-xs font-bold transition-colors"
                    >
                      Book Follow-up (Next Week)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRESCRIPTION BUILDER TAB */}
          {userRole === 'DOCTOR' && doctorTab === 'RX' && (
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white mb-2">E-Prescription</h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {prescriptionItems.map((item, index) => (
                  <div key={index} className="bg-[#222222] p-3 rounded-xl border border-[#333333] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-[#888888]">Medicine #{index + 1}</span>
                      <button type="button" onClick={() => removePrescriptionItem(index)} className="text-red-500 hover:text-red-400 text-[10px]">Remove</button>
                    </div>
                    <input 
                      type="text" 
                      list="medicines-list"
                      placeholder="Medicine Name (e.g. Paracetamol 500mg)" 
                      value={item.medicineName} 
                      onChange={(e) => updatePrescriptionItem(index, 'medicineName', e.target.value)} 
                      className="w-full bg-[#111111] border border-[#333333] rounded px-2 py-1.5 text-xs text-white" 
                    />
                    <datalist id="medicines-list">
                      {COMMON_MEDICINES.map(med => <option key={med} value={med} />)}
                    </datalist>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input 
                          type="text" 
                          list="dosages-list"
                          placeholder="Dosage (e.g. 1 Tablet)" 
                          value={item.dosage} 
                          onChange={(e) => updatePrescriptionItem(index, 'dosage', e.target.value)} 
                          className="w-full bg-[#111111] border border-[#333333] rounded px-2 py-1.5 text-xs text-white" 
                        />
                        <datalist id="dosages-list">
                          {COMMON_DOSAGES.map(dos => <option key={dos} value={dos} />)}
                        </datalist>
                      </div>
                      <div>
                        <input 
                          type="text" 
                          list="frequencies-list"
                          placeholder="Frequency (e.g. Twice a day)" 
                          value={item.frequency} 
                          onChange={(e) => updatePrescriptionItem(index, 'frequency', e.target.value)} 
                          className="w-full bg-[#111111] border border-[#333333] rounded px-2 py-1.5 text-xs text-white" 
                        />
                        <datalist id="frequencies-list">
                          {COMMON_FREQUENCIES.map(freq => <option key={freq} value={freq} />)}
                        </datalist>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input 
                          type="text" 
                          list="durations-list"
                          placeholder="Duration (e.g. 5 days)" 
                          value={item.duration} 
                          onChange={(e) => updatePrescriptionItem(index, 'duration', e.target.value)} 
                          className="w-full bg-[#111111] border border-[#333333] rounded px-2 py-1.5 text-xs text-white" 
                        />
                        <datalist id="durations-list">
                          {COMMON_DURATIONS.map(dur => <option key={dur} value={dur} />)}
                        </datalist>
                      </div>
                      <input type="text" placeholder="Instructions (Optional)" value={item.instructions} onChange={(e) => updatePrescriptionItem(index, 'instructions', e.target.value)} className="w-full bg-[#111111] border border-[#333333] rounded px-2 py-1.5 text-xs text-white" />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addPrescriptionItem} className="w-full py-2 border border-dashed border-[#444444] rounded-xl text-[10px] text-[#888888] hover:text-white hover:border-[#888888] transition-colors">+ Add Medicine</button>
              </div>
              <div className="pt-3 border-t border-[#2A2A2A] mt-3 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => submitPrescription(true)} 
                  disabled={isSubmittingRx || prescriptionItems.length === 0 || !prescriptionItems[0].medicineName}
                  className="flex-1 py-2.5 rounded-xl bg-[#333333] hover:bg-[#444444] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                >
                  {isSubmittingRx ? 'Saving...' : 'Save Draft'}
                </button>
                <button 
                  type="button" 
                  onClick={() => submitPrescription(false)} 
                  disabled={isSubmittingRx || prescriptionItems.length === 0 || !prescriptionItems[0].medicineName}
                  className="flex-1 py-2.5 rounded-xl bg-[#EF3030] hover:bg-[#D92727] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                >
                  {isSubmittingRx ? 'Issuing...' : 'Issue Prescription'}
                </button>
              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  )
}
