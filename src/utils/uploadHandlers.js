export const handleTargetUpload = async (file, setError, setVideoTargets, handleTargetSelect) => {
  if (file) {
    try {
      // Check file size (500MB limit)
      if (file.size > 500 * 1024 * 1024) {
        setError('File size exceeds 500MB limit');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-template', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Create a new template object
      const newTemplate = {
        id: data.id,
        videoPath: data.filePath,
        thumbnail: data.thumbnailPath,
        duration: data.duration,
        author: 'custom'
      };

      // Add to the beginning of videoTargets
      setVideoTargets(prev => [newTemplate, ...prev]);
      
      // Select the new template
      handleTargetSelect(newTemplate);
    } catch (error) {
      console.error('Error uploading template:', error);
      setError('Failed to upload template');
    }
  }
};

export const handleImageUpload = async (file, setError, setVideoTargets, handleTargetSelect) => {
  if (file) {
    try {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-template', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Create a new template object
      const newTemplate = {
        id: data.id,
        videoPath: data.filePath,
        thumbnail: data.thumbnailPath,
        duration: '0:00',
        author: 'custom'
      };

      // Add to the beginning of videoTargets
      setVideoTargets(prev => [newTemplate, ...prev]);
      
      // Select the new template
      handleTargetSelect(newTemplate);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
    }
  }
};

export const handleGifUpload = async (file, setError, setVideoTargets, handleTargetSelect) => {
  if (file) {
    try {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size exceeds 50MB limit');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-template', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Create a new template object
      const newTemplate = {
        id: data.id,
        videoPath: data.filePath,
        thumbnail: data.thumbnailPath,
        duration: '0:00',
        author: 'custom'
      };

      // Add to the beginning of videoTargets
      setVideoTargets(prev => [newTemplate, ...prev]);
      
      // Select the new template
      handleTargetSelect(newTemplate);
    } catch (error) {
      console.error('Error uploading GIF:', error);
      setError('Failed to upload GIF');
    }
  }
};

export const handleMultiFaceUpload = async (files, setError, setVideoTargets) => {
  if (files.length > 0) {
    try {
      // Check if any file exceeds 10MB
      const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setError('Some files exceed 10MB limit');
        return;
      }

      // Upload each file
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-template', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        
        // Create a new template object
        const newTemplate = {
          id: data.id,
          videoPath: data.filePath,
          thumbnail: data.thumbnailPath,
          duration: '0:00',
          author: 'custom'
        };

        // Add to the beginning of videoTargets
        setVideoTargets(prev => [newTemplate, ...prev]);
      }
    } catch (error) {
      console.error('Error uploading multi-face images:', error);
      setError('Failed to upload multi-face images');
    }
  }
}; 