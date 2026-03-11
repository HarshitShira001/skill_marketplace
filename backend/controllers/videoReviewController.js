const SkillRequest = require('../models/SkillRequest');

exports.reviewDemoVideo = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await SkillRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (!request.demoVideo) {
      return res.status(400).json({ message: 'No demo video linked to this request' });
    }

    // Call the Flask AI microservice running on port 5001
    const flaskServiceUrl = 'http://localhost:5001/api/review-video';
    
    const aiResponse = await fetch(flaskServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: request.demoVideo,
        skillName: request.skillName
      })
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text();
      console.error('AI Service Error:', errorData);
      return res.status(502).json({ message: 'AI Review Service failed', error: errorData });
    }

    const aiData = await aiResponse.json();

    if (aiData.error) {
      return res.status(500).json({ message: 'AI Review failed', error: aiData.error });
    }

    // Save results to the database
    request.transcript = aiData.transcript;
    request.aiRating = aiData.aiRating;
    request.aiReview = aiData.aiReview;
    await request.save();

    res.json({
      message: 'AI Review completed successfully',
      result: {
        transcript: request.transcript,
        aiRating: request.aiRating,
        aiReview: request.aiReview
      }
    });

  } catch (err) {
    console.error('Error in reviewDemoVideo:', err);
    res.status(500).json({ message: err.message });
  }
};
