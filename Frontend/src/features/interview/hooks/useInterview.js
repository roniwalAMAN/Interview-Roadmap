import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useCallback, useContext, useEffect, useState } from "react"
import { InterviewContext } from "../interviewContext"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()
    const [toast, setToast] = useState(null)

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const showToast = (message, type = 'info', duration = 4000) => {
        setToast({ message, type })
        setTimeout(() => setToast(null), duration)
    }

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        if (!jobDescription.trim()) {
            showToast('Please enter a job description', 'error')
            return null
        }

        if (!resumeFile && !selfDescription.trim()) {
            showToast('Please upload a resume or provide a self description', 'error')
            return null
        }

        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            showToast('Interview plan generated successfully!', 'success', 3000)
            setReport(response.interviewReport)
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to generate interview plan. Please try again.'
            showToast(errorMessage, 'error')
            console.error(error)
        } finally {
            setLoading(false)
        }

        return response?.interviewReport || null
    }

    const getReportById = useCallback(async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
        } catch (error) {
            showToast('Failed to load interview plan', 'error')
            console.error(error)
        } finally {
            setLoading(false)
        }
        return response?.interviewReport || null
    }, [ setLoading, setReport ])

    const getReports = useCallback(async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            setReports(response.interviewReports)
        } catch (error) {
            showToast('Failed to load interview plans', 'error')
            console.error(error)
        } finally {
            setLoading(false)
        }

        return response?.interviewReports || []
    }, [ setLoading, setReports ])

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            const response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            showToast('Resume downloaded successfully!', 'success', 3000)
        }
        catch (error) {
            showToast('Failed to download resume', 'error')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId, getReportById, getReports ])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf, toast, setToast }

}