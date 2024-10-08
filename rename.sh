#!/bin/bash

# Directory containing the images
directory="assets/"

# Change to the directory
cd "$directory" || exit

# Counter for renaming
count=0

# Iterate over IMG_* files in sorted order
for file in $(ls IMG_* | sort); do
    # Get the file extension
    extension="${file##*.}"
    
    # Create the new filename
    new_filename="NYC_${count}.${extension}"
    
    # Rename the file
    mv "$file" "$new_filename"
    echo "Renamed '$file' to '$new_filename'"
    
    # Increment the counter
    ((count++))
done

echo "Renaming complete."
