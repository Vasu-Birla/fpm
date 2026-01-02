<!-- Header Start -->
    <?php include('header.php'); ?>
<!-- Header End -->

<!-- Sidebar Start -->
    <?php include('sidebar.php'); ?>
<!-- Sidebar End -->

<!-- ========================
    Start Page Content
========================= -->
    
<div class="page-wrapper">

    <!-- Start Content -->
    <div class="content">

        <!-- row start -->
        <div class="row justify-content-center">
            <div class="col-lg-12">
                <!-- page header start -->
                <div class="mb-4">
                    <h6 class="fw-bold mb-0 d-flex align-items-center"> <a href="firmstaff-list.php" class="text-dark"> <i class="ti ti-chevron-left me-1"></i>Edit Firm User</a></h6>
                </div>
                <!-- page header end -->

                <!-- card start -->
                <form action="#" method="POST">
                    <div class="card">
                        <div class="card-body pb-0">
                            <div class="form">
                                <h6 class="fw-bold mb-3">Staff Basic Information</h6>
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="mb-3">
                                            <label for="user_role" class="form-label fw-medium">User Role</label>
                                            <select class="form-select select2" id="user_role" name="user_role" required>
                                                <option value="">Select Case</option>
                                                <option>Firm Staff</option>
                                                <option>Lawyer</option>
                                                <option>Paralegal</option>
                                                <option>Finance</option>
                                                <option>Intake</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="first_name" class="form-label mb-1 fw-medium">First Name<span class="text-danger ms-1">*</span></label>
                                            <input type="text" id="first_name" name="first_name" class="form-control" placeholder="Enter the first name" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="last_name" class="form-label mb-1 fw-medium">Last Name<span class="text-danger ms-1">*</span></label>
                                            <input type="text" id="last_name" name="last_name" class="form-control" placeholder="Enter the last name" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="email" class="form-label mb-1 fw-medium">Email Address<span class="text-danger ms-1">*</span></label>
                                            <input type="email" id="email" name="email" class="form-control" placeholder="Enter the email" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="full_contact" class="form-label mb-1 fw-medium">Phone Number<span class="text-danger ms-1">*</span></label>
                                            <div class="input-group kiltel-phone-wrap col-6">
                                                <button type="button" class="kiltel-country-trigger"></button>
                                                <input type="tel" class="form-control" name="full_contact" data-kilvish-tel  id="kilvishcontact" data-kilvish-preferred="JM,IN"  data-kiltel-init="JM" data-kiltel-validation="yes" required>
                                                <input type="hidden" id="country_code" name="country_code">
                                                <input type="hidden" id="contact" name="contact">
                                            </div>
                                            <div id="errorText1" style="color: red;"></div>
                                            <div id="kiltel-error" style="color:red; font-size:0.93em; margin-top:5px;"></div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="password" class="form-label mb-1 fw-medium">Password<span class="text-danger ms-1">*</span></label>
                                            <div class="position-relative">
                                                <div class="pass-group input-group position-relative border rounded">
                                                    <span class="input-group-text bg-white border-0">
                                                        <i class="ti ti-lock text-dark fs-14"></i>
                                                    </span>
                                                    <input type="password" id="password" name="password" class="ps-0 border-0 form-control kilpass" placeholder="****************" required>
                                                    <span toggle="#newPassword" class="fa fa-eye-slash toggle-password text-dark fs-14"></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="license_number" class="form-label mb-1 fw-medium">License Number<span class="text-danger ms-1"></span></label>
                                            <input type="text" id="license_number" name="license_number" class="form-control"  placeholder="LAW/1234/2025" required>
                                        </div>
                                    </div>
                                    
                                    <!-- <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="username" class="form-label mb-1 fw-medium">Username<span class="text-danger ms-1">*</span></label>
                                            <input type="text" id="username" name="username" class="form-control"  placeholder="Enter the username" required>
                                        </div>
                                    </div> -->
                                    
                                    <!-- <div class="col-md-6">
                                        <label class="form-label">Select Practice Areas</label>
                                        <div class="dropdown w-100">
                                            <button class="form-control dropdown-toggle w-100" type="button" id="practiceDropdownButton" data-bs-toggle="dropdown" aria-expanded="false" style="text-align: left; white-space: normal; overflow: hidden; text-overflow: ellipsis;">
                                            Select Practice Areas
                                            </button>
                                            <ul class="dropdown-menu p-3" aria-labelledby="practiceDropdownButton" style="max-height: 250px; overflow-y: auto; width: 100%;">
                                                <li>
                                                    <div class="form-check">
                                                    <input class="form-check-input practice-check" type="checkbox" value="criminal_law" id="practice_criminal" name="practice_areas[]">
                                                    <label class="form-check-label" for="practice_criminal">Criminal Law</label>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div class="form-check">
                                                    <input class="form-check-input practice-check" type="checkbox" value="family_law" id="practice_family" name="practice_areas[]">
                                                    <label class="form-check-label" for="practice_family">Family Law</label>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div class="form-check">
                                                    <input class="form-check-input practice-check" type="checkbox" value="corporate_law" id="practice_corporate" name="practice_areas[]">
                                                    <label class="form-check-label" for="practice_corporate">Corporate Law</label>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div class="form-check">
                                                    <input class="form-check-input practice-check" type="checkbox" value="real_estate_law" id="practice_real_estate" name="practice_areas[]">
                                                    <label class="form-check-label" for="practice_real_estate">Real Estate Law</label>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div class="form-check">
                                                    <input class="form-check-input practice-check" type="checkbox" value="tax_law" id="practice_tax" name="practice_areas[]">
                                                    <label class="form-check-label" for="practice_tax">Tax Law</label>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div class="form-check">
                                                    <input class="form-check-input practice-check" type="checkbox" value="immigration_law" id="practice_immigration" name="practice_areas[]">
                                                    <label class="form-check-label" for="practice_immigration">Immigration Law</label>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div class="form-check">
                                                    <input class="form-check-input practice-check" type="checkbox" value="intellectual_property" id="practice_ip" name="practice_areas[]">
                                                    <label class="form-check-label" for="practice_ip">Intellectual Property</label>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div class="form-check">
                                                    <input class="form-check-input practice-check" type="checkbox" value="employment_law" id="practice_employment" name="practice_areas[]">
                                                    <label class="form-check-label" for="practice_employment">Employment Law</label>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>
                                    </div> -->
                                    <!-- <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="confirmpassword" class="form-label mb-1 fw-medium">Confirm Password<span class="text-danger ms-1">*</span></label>
                                            <div class="position-relative">
                                                <div class="pass-group input-group position-relative border rounded">
                                                    <span class="input-group-text bg-white border-0">
                                                        <i class="ti ti-lock text-dark fs-14"></i>
                                                    </span>
                                                    <input type="password" id="confirmpassword" name="confirmpassword" class="pass-input form-control ps-0 border-0" placeholder="****************" required>
                                                    <span class="input-group-text bg-white border-0">
                                                        <i class="ti toggle-password ti-eye-off text-dark fs-14"></i>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div> -->
                                </div>

                                <!-- <h6 class="fw-bold mb-3 border-top pt-3">Address Information</h6> 
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="mb-3">
                                            <label for="firm_address" class="form-label mb-1 fw-medium">Address<span class="text-danger ms-1">*</span></label>
                                            <textarea class="form-control" id="firm_address" name="firm_address" rows="3" placeholder="Enter address, city, zip"></textarea>
                                        </div>
                                    </div>
                                </div> -->

                                <!-- <h6 class="fw-bold mb-3 border-top pt-3">Other Information</h6>  -->
                                <div class="row">
                                    <!-- <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="bar_council" class="form-label mb-1 fw-medium">Bar Council Registered With<span class="text-danger ms-1">*</span></label>
                                            <input type="text" id="bar_council" name="bar_council" class="form-control"  placeholder="Enter the bar council" required>
                                        </div>
                                    </div> -->
                                    <!-- <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="practice_area" class="form-label mb-1 fw-medium">Practice Area<span class="text-danger ms-1">*</span></label>
                                            <input type="text" id="practice_area" name="practice_area" class="form-control"  placeholder="e.g., Criminal, Corporate, Family Law" required>
                                        </div>
                                    </div> -->
                                    <!-- <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="experience" class="form-label mb-1 fw-medium">Years of Experience<span class="text-danger ms-1">*</span></label>
                                            <input type="number" id="experience" name="experience" class="form-control" min="0" placeholder="Enter the experience" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="education" class="form-label mb-1 fw-medium">Highest Qualification<span class="text-danger ms-1">*</span></label>
                                            <input type="text" id="education" name="education" class="form-control" min="0" placeholder="LLB, LLM, etc." required>
                                        </div>
                                    </div> -->
                                    <div class="col-lg-6">
                                        <div class="mb-3 d-flex align-items-center">
                                            <label for="firm_logo" class="form-label mb-0">Avatar (optional)</label>
                                            <div class="drag-upload-btn avatar avatar-xxl rounded-circle bg-light text-muted position-relative overflow-hidden z-1 mb-2 ms-4 p-0">
                                                <i class="ti ti-user-plus fs-16"></i>
                                                <input type="file" id="firm_logo" name="firm_logo" class="form-control image-sign" multiple="">
                                                <div class="position-absolute bottom-0 end-0 star-0 w-100 h-25 bg-dark d-flex align-items-center justify-content-center z-n1">
                                                    <a href="javascript:void(0);" class="text-white d-flex align-items-center justify-content-center">
                                                        <i class="ti ti-photo fs-14"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-lg-6">
                                        <div class="mb-3">
                                            <label for="firm_certificate" class="form-label mb-1">Upload Lawyer Certificate/Document<span class="text-danger ms-1">*</span></label>
                                            <div class="mb-3 d-flex align-items-center">
                                                <div class="drag-upload-btn avatar avatar-xxl bg-light text-muted position-relative overflow-hidden z-1 mb-2 ms-4 p-0">
                                                    <i class="ti ti-user-plus fs-16"></i>
                                                    <input type="file" id="firm_certificate[]" name="firm_certificate[]" class="form-control image-sign" multiple>
                                                    <div class="position-absolute bottom-0 end-0 star-0 w-100 h-25 bg-dark d-flex align-items-center justify-content-center z-n1">
                                                        <a href="javascript:void(0);" class="text-white d-flex align-items-center justify-content-center">
                                                            <i class="ti ti-photo fs-14"></i>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>     
                                    <!-- <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="firm_status" class="form-label mb-1 fw-medium">Status<span class="text-danger ms-1">*</span></label>
                                            <select class="select" id="firm_status" name="firm_status" required>
                                                <option value="active" selected>Active</option>
                                                <option value="suspended">Suspended</option>
                                            </select>
                                        </div>
                                    </div>    -->     
                                </div>
                                <!-- Agreement -->
                                <!-- <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="agree" name="agree" required>
                                    <label class="form-check-label" for="agree">
                                        I agree to the <a href="terms.php" target="_blank">Terms and Conditions</a>
                                    </label>
                                </div>                                    -->
                            </div>
                        </div>
                    </div>
                    <!-- card end -->

                    <div class="d-flex align-items-center justify-content-end">
                        <a href="firmstaff-list.php" class="btn btn-light me-2">Cancel</a>
                        <button type="submit" name="submit"  class="btn btn-primary btn-md fs-13 fw-medium rounded">Update User</button>
                    </div>
                </form>

            </div>
        </div>
        <!-- row end -->               
        
    </div>
    <!-- End Content -->

</div>

<!-- ========================
    End Page Content
========================= -->

<!-- Footer Start -->
    <?php include ('footer.php'); ?>
<!-- Footer End -->

<script>
  // ✅ JS to update button text based on selected practice areas
  const practiceCheckboxes = document.querySelectorAll('.practice-check');
  const practiceDropdownButton = document.getElementById('practiceDropdownButton');

  practiceCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const selected = [...practiceCheckboxes].filter(c => c.checked).map(c => c.nextElementSibling.innerText);
      practiceDropdownButton.innerText = selected.length > 0 ? selected.join(', ') : 'Select Practice Areas';
    });
  });
</script>